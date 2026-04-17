package permissions

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

func UpdatePermission(ctx context.Context, db *databases.Container, p *queue.UpdateRolePermissionPayload) *httputil.ErrorResponse {
	_, err := db.Postgres.Exec(ctx, "UPDATE permissions set list = $1 where role_id = $2", p.Permission, p.RoleID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
