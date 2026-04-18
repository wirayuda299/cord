package roles

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type UnassignRolePayload struct {
	MemberUserID string `json:"member_user_id"`
	ServerID     string `json:"server_id"`
	RoleID       string `json:"role_id"`
}

func UnassignRole(ctx context.Context, db *databases.Container, p *UnassignRolePayload) *httputil.ErrorResponse {
	if p.MemberUserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("member_user_id is required"), Code: http.StatusBadRequest}
	}
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}
	if p.RoleID == "" {
		return &httputil.ErrorResponse{Err: errors.New("role_id is required"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx,
		"DELETE FROM user_roles WHERE user_id = $1 AND server_id = $2 AND role_id = $3",
		p.MemberUserID, p.ServerID, p.RoleID,
	)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
