package permissions

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type Permission struct {
	ID          string    `json:"id"`
	RoleID      string    `json:"role_id"`
	Permissions []string  `json:"permissions"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func FindPermissionByRoleID(ctx context.Context, db *databases.Container, roleID string) ([]Permission, *httputil.ErrorResponse) {
	if roleID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New(`role ID is missing`), Code: http.StatusBadRequest}
	}

	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// Without this, any authenticated user could read any server's role
	// permission list just by knowing (or guessing) a role_id — there was
	// previously no check at all here beyond "is logged in."
	var serverID string
	if err := db.Postgres.QueryRow(ctx, "SELECT server_id::text FROM roles WHERE id = $1", roleID).Scan(&serverID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: errors.New("role not found"), Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var isMember bool
	if err := db.Postgres.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM servers WHERE id = $1 AND created_by = $2
			UNION ALL
			SELECT 1 FROM members WHERE server_id = $1 AND user_id = $2
		)
	`, serverID, userID).Scan(&isMember); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !isMember {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you are not a member of this server"), Code: http.StatusForbidden}
	}

	var permissions []Permission

	rows, err := db.Postgres.Query(ctx, "SELECT id,role_id,list,created_at,updated_at from permissions where role_id = $1", roleID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
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
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return permissions, nil
}
