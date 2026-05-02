package members

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Member struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	AvatarURL string    `json:"avatar_url"`
	AvatarID  string    `json:"avatar_id"`
	JoinedAt  time.Time `json:"joined_at"`
	Role      *string   `json:"role"`
	RoleID    *string   `json:"role_id"`
	RoleColor *string   `json:"role_color"`
	ServerID  string    `json:"server_id"`
}

func FindMembersInServer(ctx context.Context, db *databases.Container, serverID string) ([]Member, *httputil.ErrorResponse) {
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	var isServerExists bool
	err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM servers where id = $1)", serverID).Scan(&isServerExists)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !isServerExists {
		return nil, &httputil.ErrorResponse{Err: errors.New("Server not found"), Code: http.StatusNotFound}
	}

	members := make([]Member, 0)

	rows, err := db.Postgres.Query(ctx, `
			select
			m.id,
			m.user_id,
			m.server_id,
			sp.username,
			sp.avatar,
			sp.avatar_asset_id,
			r.name,
			r.id as role_id,
			r.color,
			m.joined_at
			from members as m
			left join server_profile as sp on sp.user_id = m.user_id and sp.server_id = m.server_id
			left join user_roles as ur on ur.user_id = m.user_id
			left join roles as r on r.id = ur.role_id
			where m.server_id = $1
		`, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()
	for rows.Next() {
		var m Member

		if err := rows.Scan(&m.ID, &m.UserID, &m.ServerID, &m.Username, &m.AvatarURL, &m.AvatarID, &m.Role, &m.RoleID, &m.RoleColor, &m.JoinedAt); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		members = append(members, m)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return members, nil
}
