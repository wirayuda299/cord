package roles

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/members"
)

type Role struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ServerID    string `json:"server_id"`
	Color       string `json:"color"`
	Icon        string `json:"icon"`
	Hoist       bool   `json:"hoist"`
	Mentionable bool   `json:"mentionable"`
}

func GetAllRoles(ctx context.Context, db *databases.Container, serverID string) ([]Role, *httputil.ErrorResponse) {
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	// Without this, any authenticated user could enumerate any server's role
	// list (names, colors, IDs usable in roles/assign) without being a
	// member of it.
	joined, joinErr := members.IsUserJoinedServer(ctx, db, serverID)
	if joinErr != nil {
		return nil, joinErr
	}
	if !joined {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you are not a member of this server"), Code: http.StatusForbidden}
	}

	rows, err := db.Postgres.Query(ctx, "select id,name,server_id,color,icon,hoist,mentionable from roles where server_id = $1", serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()
	roles := make([]Role, 0)

	for rows.Next() {
		var r Role
		err := rows.Scan(&r.ID, &r.Name, &r.ServerID, &r.Color, &r.Icon, &r.Hoist, &r.Mentionable)
		if err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}

		roles = append(roles, r)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return roles, nil
}
