package members

import (
	"context"
	"errors"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/services/servers/audit"
	"github.com/wirayuda299/backend/internal/services/servers/safety"
	"github.com/wirayuda299/backend/internal/utils"
)

func kick(ctx context.Context, db *databases.Container, member_user_id, server_id string) error {
	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "DELETE FROM user_roles WHERE user_id = $1 AND server_id = $2", member_user_id, server_id)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, "DELETE FROM members WHERE user_id = $1 AND server_id = $2", member_user_id, server_id)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

type Evictor interface {
	EvictUser(serverId, userId string)
	NotifyUser(userId string, payload any)
}

type KickMemberPayload struct {
	MemberID string `json:"member_id"`
	ServerID string `json:"server_id"`
}

func KickMember(ctx context.Context, db *databases.Container, hub Evictor, p KickMemberPayload) *httputil.ErrorResponse {

	currentUser, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if p.MemberID == currentUser {
		return &httputil.ErrorResponse{
			Err:  errors.New("you cannot kick yourself"),
			Code: http.StatusBadRequest,
		}
	}

	var isServerExists bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM servers WHERE id = $1)", p.ServerID).Scan(&isServerExists)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !isServerExists {
		return &httputil.ErrorResponse{Err: errors.New("server not found"), Code: http.StatusNotFound}
	}

	var isMemberExists bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM members WHERE user_id = $1 AND server_id = $2)", p.MemberID, p.ServerID).Scan(&isMemberExists)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !isMemberExists {
		return &httputil.ErrorResponse{Err: errors.New("user is not a member of this server"), Code: http.StatusNotFound}
	}

	var ownerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", p.ServerID).Scan(&ownerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if p.MemberID == ownerID {
		return &httputil.ErrorResponse{
			Err:  errors.New("you cannot kick the server owner"),
			Code: http.StatusForbidden,
		}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "kick_member",
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !hasPerm {
		return &httputil.ErrorResponse{
			Err:  errors.New("you not have permission to kick member"),
			Code: http.StatusForbidden,
		}
	}

	s, safetyErr := safety.GetServerSafetySettings(ctx, db, p.ServerID)
	if safetyErr != nil {
		return safetyErr
	}

	if s.Require2FA {
		u, err := user.Get(ctx, currentUser)
		if err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		if !u.TwoFactorEnabled {
			return &httputil.ErrorResponse{Err: errors.New("you must enable 2FA to kick a member"), Code: http.StatusForbidden}
		}
	}

	err = kick(ctx, db, p.MemberID, p.ServerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var targetUsername string
	_ = db.Postgres.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", p.MemberID).Scan(&targetUsername)
	_ = audit.EnqueueAuditEntry(ctx, db.Redis, p.ServerID, currentUser, "member_kicked", targetUsername, nil)

	if hub != nil {
		hub.EvictUser(p.ServerID, p.MemberID)
		hub.NotifyUser(p.MemberID, map[string]string{
			"type":      "removed_from_server",
			"server_id": p.ServerID,
			"reason":    "kicked",
		})
	}

	return nil
}
