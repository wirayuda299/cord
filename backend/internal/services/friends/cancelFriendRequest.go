package friends

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type PendingRequests struct {
	ID          string `json:"id"`
	RequesterID string `json:"requester_id"`
}

func CancelFriendRequest(ctx context.Context, db *databases.Container, id string, currentUserID string) *httputil.ErrorResponse {
	if id == "" {
		return &httputil.ErrorResponse{Err: errors.New("request id is missing"), Code: http.StatusBadRequest}
	}

	var p PendingRequests
	err := db.Postgres.QueryRow(ctx, `SELECT id,requester_id from friends where id = $1`, id).Scan(&p.ID, &p.RequesterID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusBadRequest}
	}

	if p.RequesterID != currentUserID {
		return &httputil.ErrorResponse{Err: errors.New("Unauthorized"), Code: http.StatusUnauthorized}
	}

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err = tx.Rollback(ctx); err != nil {
			fmt.Println(err.Error())
		}
	}()
	_, err = tx.Exec(ctx, `DELETE FROM friends where id = $1`, id)

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err = tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
