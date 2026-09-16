package roles

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type AssignRolePayload struct {
	MemberUserID string `json:"member_user_id"`
	ServerID     string `json:"server_id"`
	RoleID       string `json:"role_id"`
}

func AssignRole(ctx context.Context, db *databases.Container, p *AssignRolePayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_role",
	})

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to assign role"), Code: http.StatusUnauthorized}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	if p.RoleID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Role ID is missing"), Code: http.StatusBadRequest}
	}

	if p.MemberUserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("member user ID is missing"), Code: http.StatusBadRequest}
	}

	// HasPermission only proves the caller manages *a* role on p.ServerID —
	// without this, they could assign a role_id belonging to a different
	// server, granting that foreign role's permissions (hasPermission's
	// role-permission join filters by user_roles.server_id, not the role's
	// own server_id) to a member of this one.
	var roleBelongsToServer bool
	if err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1 AND server_id = $2)", p.RoleID, p.ServerID).Scan(&roleBelongsToServer); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !roleBelongsToServer {
		return &httputil.ErrorResponse{Err: errors.New("role not found"), Code: http.StatusNotFound}
	}

	_, err = db.Postgres.Exec(ctx, "INSERT INTO user_roles(user_id,server_id,role_id,assigned_by) values($1,$2,$3,$4)", p.MemberUserID, p.ServerID, p.RoleID, userID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
