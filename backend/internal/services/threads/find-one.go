package threads

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/utils"
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
	_, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if id == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("thread is is missing"), Code: http.StatusBadRequest}
	}

	var t Thread

	err = db.Postgres.QueryRow(ctx, `
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

	// Threads inherit their parent channel's access boundary — without this,
	// any authenticated user who obtains a thread ID (from any server,
	// public or private) could read its metadata.
	allowed, accessErr := members.VerifyChannelAccess(ctx, db, t.ChannelID)
	if accessErr != nil {
		return nil, &httputil.ErrorResponse{Err: accessErr, Code: http.StatusInternalServerError}
	}
	if !allowed {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have access to this thread"), Code: http.StatusForbidden}
	}

	return &t, nil
}
