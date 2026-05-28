package threads

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Thread struct {
	ID         string `json:"id"`
	ChannelID  string `json:"channel_id"`
	Name       string `json:"name"`
	CreatedBy  string `json:"created_by"`
	IsArchived bool   `json:"is_archived"`
	IsLocked   bool   `json:"is_locked"`
	MessageID  string `json:"message_id"`
}

func FindThreadByID(ctx context.Context, db *databases.Container, id string) (*Thread, *httputil.ErrorResponse) {
	if id == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("thread is is missing"), Code: http.StatusBadRequest}
	}

	var t Thread

	err := db.Postgres.QueryRow(ctx, `
		SELECT
		id,
		channel_id,
		name,
		created_by,
		is_archived,
		is_locked,
		message_id
		from threads
		where id = $1`, id).Scan(&t.ID, &t.ChannelID, &t.Name, &t.CreatedBy, &t.IsArchived, &t.IsLocked, &t.MessageID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return &t, nil
}
