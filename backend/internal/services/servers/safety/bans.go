package safety

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/services/servers/audit"
	"github.com/wirayuda299/backend/internal/utils"
)

type Evictor interface {
	EvictUser(serverId, userId string)
	NotifyUser(userId string, payload any)
}

type BanMemberPayload struct {
	ServerID string `json:"server_id"`
	MemberID string `json:"member_id"`
	Reason   string `json:"reason"`
}

type BannedMemberRow struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Initials string    `json:"initials"`
	Color    string    `json:"color"`
	Reason   *string   `json:"reason"`
	BannedAt time.Time `json:"bannedAt"`
	BannedBy string    `json:"bannedBy"`
}

func BanMember(ctx context.Context, db *databases.Container, hub Evictor, p *BanMemberPayload) *httputil.ErrorResponse {
	currentUser, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if p.MemberID == currentUser {
		return &httputil.ErrorResponse{Err: errors.New("you cannot ban yourself"), Code: http.StatusBadRequest}
	}

	// Verify permissions
	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "ban_member", // Standard permission
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Check if owner
	var ownerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", p.ServerID).Scan(&ownerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if currentUser != ownerID && !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have permission to ban members"), Code: http.StatusForbidden}
	}

	if p.MemberID == ownerID {
		return &httputil.ErrorResponse{Err: errors.New("you cannot ban the server owner"), Code: http.StatusForbidden}
	}

	// Start transaction
	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer tx.Rollback(ctx)

	// Clean up roles and membership — a ban removes them from the server
	// just like a kick. The dedicated bans list (FindBannedMembers below)
	// reads from the bans table, not members, so it still shows them.
	_, _ = tx.Exec(ctx, "DELETE FROM user_roles WHERE user_id = $1 AND server_id = $2", p.MemberID, p.ServerID)

	// Insert into bans
	_, err = tx.Exec(ctx, `
		INSERT INTO bans (server_id, user_id, reason, banned_by)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (server_id, user_id) DO UPDATE SET reason = EXCLUDED.reason
	`, p.ServerID, p.MemberID, p.Reason, currentUser)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	_, err = tx.Exec(ctx, "DELETE FROM members WHERE user_id = $1 AND server_id = $2", p.MemberID, p.ServerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var targetUsername string
	_ = db.Postgres.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", p.MemberID).Scan(&targetUsername)

	var changes []audit.AuditChange
	if p.Reason != "" {
		changes = append(changes, audit.AuditChange{
			Field: "reason",
			After: p.Reason,
		})
	}
	_ = audit.EnqueueAuditEntry(ctx, db.Redis, p.ServerID, currentUser, "member_banned", targetUsername, changes)

	// Evict from active websockets immediately
	if hub != nil {
		hub.EvictUser(p.ServerID, p.MemberID)
		hub.NotifyUser(p.MemberID, map[string]string{
			"type":      "removed_from_server",
			"server_id": p.ServerID,
			"reason":    "banned",
		})
	}

	return nil
}

func UnbanMember(ctx context.Context, db *databases.Container, serverID string, memberID string) *httputil.ErrorResponse {
	currentUser, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// Verify permissions
	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   serverID,
		Permission: "ban_member",
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var ownerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", serverID).Scan(&ownerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if currentUser != ownerID && !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have permission to unban members"), Code: http.StatusForbidden}
	}

	var targetUsername string
	_ = db.Postgres.QueryRow(ctx, "SELECT username FROM users WHERE id = $1", memberID).Scan(&targetUsername)

	_, err = db.Postgres.Exec(ctx, "DELETE FROM bans WHERE server_id = $1 AND user_id = $2", serverID, memberID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	_ = audit.EnqueueAuditEntry(ctx, db.Redis, serverID, currentUser, "member_unbanned", targetUsername, nil)

	return nil
}

func FindBannedMembers(ctx context.Context, db *databases.Container, serverID string) ([]BannedMemberRow, *httputil.ErrorResponse) {
	currentUser, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// Verify permissions
	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   serverID,
		Permission: "ban_member",
	})
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var ownerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", serverID).Scan(&ownerID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if currentUser != ownerID && !hasPerm {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have permission to view bans"), Code: http.StatusForbidden}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT 
			b.user_id, 
			u.username, 
			b.reason, 
			b.banned_at, 
			u_by.username AS banned_by
		FROM bans b
		JOIN users u ON b.user_id = u.id
		JOIN users u_by ON b.banned_by = u_by.id
		WHERE b.server_id = $1
		ORDER BY b.banned_at DESC
	`, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	var result []BannedMemberRow = make([]BannedMemberRow, 0)
	for rows.Next() {
		var row BannedMemberRow
		var reason *string
		err = rows.Scan(&row.ID, &row.Name, &reason, &row.BannedAt, &row.BannedBy)
		if err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		// Initials & Color for frontend display convenience
		if len(row.Name) > 0 {
			row.Initials = string(row.Name[0])
			if len(row.Name) > 1 {
				row.Initials += string(row.Name[1])
			}
		}
		row.Color = "bg-red-500/20 text-red-400"
		row.Reason = reason

		result = append(result, row)
	}

	return result, nil
}
