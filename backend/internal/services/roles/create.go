package roles

import (
	"context"
	"errors"
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
	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("Role name is required")}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is required")}
	}
	if p.Color == "" {
		return &httputil.ErrorResponse{Err: errors.New("Color is required")}
	}

	var id string

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, "INSERT INTO roles(name,server_id,role_color,icon,hoist,mentionable) values($1,$2,$3,$4,$5,$6) returning id;", p.Name, p.ServerID, p.Color, p.Icon, p.Hoist, p.Mentionable).Scan(&id)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	_, err = tx.Exec(ctx, "INSERT INTO permission(role_id,permission) values($1,$2)", id, p.PermissionIDs)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
