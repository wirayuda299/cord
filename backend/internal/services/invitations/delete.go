package invitations

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type DeleteInvitationPayload struct {
	Code      string `json:"code"`
	DeletedBy string `json:"deleted_by"`
}

func DeleteInvitationCode(ctx context.Context, db *databases.Container, p *DeleteInvitationPayload) *httputil.ErrorResponse {
	if p.Code == "" {
		return &httputil.ErrorResponse{Err: errors.New("Invitation code is missing"), Code: http.StatusBadRequest}
	}

	if p.DeletedBy == "" {
		return &httputil.ErrorResponse{Err: errors.New("Unauthorized"), Code: http.StatusUnauthorized}
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

	var exist bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(select 1 from invitations where code = $1)", p.Code).Scan(&exist)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !exist {
		return &httputil.ErrorResponse{Err: errors.New("Invitation not found"), Code: http.StatusNotFound}
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
