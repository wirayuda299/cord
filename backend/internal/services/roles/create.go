package roles

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateRolePayload struct {
	Name          string   `json:"name"`
	ServerID      string   `json:"server_id"`
	Color         string   `json:"color"`
	Icon          string   `json:"icon"`
	Hoist         bool     `json:"hoist"`
	Mentionable   bool     `json:"mentionable"`
	PermissionIDs []string `json:"permission_ids"`
}

func CreateRole(ctx context.Context, db *databases.Container, p *CreateRolePayload) *httputil.ErrorResponse {
	var id string
	err := db.Postgres.QueryRow(ctx, "INSERT INTO roles(name,server_id,role_color,icon,hoist,mentionable) values($1,$2,$3,$4,$5,$6) returning id;", p.Name, p.ServerID, p.Color, p.Icon, p.Hoist, p.Mentionable).Scan(&id)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusBadRequest}
	}

	_, err = db.Postgres.Exec(ctx, "INSERT INTO permission(role_id,permission) values($1,$2)", id, p.PermissionIDs)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
