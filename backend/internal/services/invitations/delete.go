package invitations

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
)

type DeleteInvitationPayload struct {
	Code string `json:"code"`
}

func DeleteInvitationCode(ctx context.Context, db *databases.Container, p *DeleteInvitationPayload) *httputil.ErrorResponse {
	if p.Code == "" {
		return &httputil.ErrorResponse{Err: errors.New("Invitation code is missing"), Code: http.StatusBadRequest}
	}
	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			log.Printf("Error rollback invitation delete -> %s", err)
		}
	}()

	var serverID string
	err = tx.QueryRow(ctx, "SELECT server_id::text from invitations where code = $1", p.Code).Scan(&serverID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("Invitation not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   serverID,
		Permission: "manage_server",
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete invitation"), Code: http.StatusUnauthorized}
	}

	_, err = tx.Exec(ctx, "DELETE FROM invitations where code = $1", p.Code)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if err := tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
