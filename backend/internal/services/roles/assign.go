package roles

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type AssignRolePayload struct {
	MemberUserID string `json:"member_user_id"`
	ServerID     string `json:"server_id"`
	RoleId       string `json:"role_id"`
	AssignedBy   string `json:"assigned_by"`
}

func AssignRole(ctx context.Context, db *databases.Container, p *AssignRolePayload) *httputil.ErrorResponse {
	if p.AssignedBy == "" {
		return &httputil.ErrorResponse{Err: errors.New("Unathorized"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	if p.RoleId == "" {
		return &httputil.ErrorResponse{Err: errors.New("Role ID is missing"), Code: http.StatusBadRequest}
	}

	if p.MemberUserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Member user ID is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, "INSERT INTO user_roles(user_id,server_id,role_id,assigned_by) values($1,$2,$3,$4)", p.MemberUserID, p.ServerID, p.RoleId, p.AssignedBy)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
