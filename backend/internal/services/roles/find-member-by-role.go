package roles

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type UserRoles struct {
	UserID    string `json:"user_id"`
	RoleID    string `json:"role_id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
}

func FindAllMemberByRole(ctx context.Context, db *databases.Container, role_id string) ([]UserRoles, *httputil.ErrorResponse) {
	if role_id == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Role ID is missing"), Code: http.StatusBadRequest}
	}

	var members []UserRoles

	rows, err := db.Postgres.Query(ctx, `SELECT
		sp.user_id,
		ur.role_id,
		sp.username,
		COALESCE(sp.avatar, '')
		from user_roles as ur
		left join server_profile as sp on sp.user_id = ur.user_id
		where ur.role_id = $1
		`, role_id)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	for rows.Next() {
		var m UserRoles
		if err := rows.Scan(&m.UserID, &m.RoleID, &m.Username, &m.AvatarURL); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		members = append(members, m)
	}

	if rows.Err() != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return members, nil
}
