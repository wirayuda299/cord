package pin

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

func DeletePinMessage(ctx context.Context, db *databases.Container, id string) *httputil.ErrorResponse {
	if id == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("Message ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	var exists bool
	if err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from pinned_messages where message_id = $1)", id).Scan(&exists); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	if !exists {
		return &httputil.ErrorResponse{
			Err:  errors.New("Message doesn't exists"),
			Code: http.StatusNotFound,
		}
	}
	if _, err := db.Postgres.Exec(ctx, "DELETE FROM pinned_messages where message_id = $1", id); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
