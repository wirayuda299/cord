package permissions

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Permission struct {
	ID          string    `json:"id"`
	RoleID      string    `json:"role_id"`
	Permissions []string  `json:"permissions"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func FindPermissionByRoleId(ctx context.Context, db *databases.Container, roleID string) ([]Permission, *httputil.ErrorResponse) {
	if roleID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Role ID is missing"), Code: http.StatusBadRequest}
	}
	var permissions []Permission

	rows, err := db.Postgres.Query(ctx, "SELECT id,role_id,permission,created_at,updated_at from permission where role_id = $1", roleID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusBadRequest}
	}
	defer rows.Close()

	for rows.Next() {
		var p Permission
		err := rows.Scan(&p.ID, &p.RoleID, &p.Permissions, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		permissions = append(permissions, p)
	}

	return permissions, nil
}
