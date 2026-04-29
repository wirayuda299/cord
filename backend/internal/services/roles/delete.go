package roles

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type DeleteRolePayload struct {
	RoleId string `json:"role_id"`
	UserId string `json:"user_id"`
}

type RoleRes struct {
	RoleId string
	UserID string
}

func DeleteRole(ctx context.Context, db *databases.Container, p *DeleteRolePayload) *httputil.ErrorResponse {
	var r RoleRes

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			log.Printf("Error rollback -> %s", err)
		}
	}()
	err = tx.QueryRow(ctx, "SELECT id, created_by from roles where id = $1", p.RoleId).Scan(&r.RoleId, &r.UserID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("Role not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if p.UserId != r.UserID {
		return &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}
	_, err = tx.Exec(ctx, "DELETE FROM roles where id = $1", p.RoleId)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
