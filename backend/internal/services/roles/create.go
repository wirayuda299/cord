package roles

import (
	"context"
	"errors"
	"log"
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
	CreatedBy     string   `json:"created_by"`
	Mentionable   bool     `json:"mentionable"`
	PermissionIDs []string `json:"permission_ids"`
	IconID        string   `json:"icon_id"`
}

func CreateRole(ctx context.Context, db *databases.Container, p *CreateRolePayload) *httputil.ErrorResponse {
	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("role name is required"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}
	if p.Color == "" {
		return &httputil.ErrorResponse{Err: errors.New("color is required"), Code: http.StatusBadRequest}
	}

	if p.CreatedBy == "" {
		return &httputil.ErrorResponse{Err: errors.New("User ID is missing"), Code: http.StatusBadRequest}
	}

	var id string

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			log.Println("error -> ", err)
		}
	}()

	err = tx.QueryRow(ctx, "INSERT INTO roles(name,server_id,color,icon,hoist,mentionable,created_by,icon_id) values($1,$2,$3,$4,$5,$6,$7,$8) returning id;", p.Name, p.ServerID, p.Color, p.Icon, p.Hoist, p.Mentionable, p.CreatedBy, p.IconID).Scan(&id)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	_, err = tx.Exec(ctx, "INSERT INTO permissions(role_id,list) values($1,$2)", id, p.PermissionIDs)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
