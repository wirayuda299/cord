package friends

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type AcceptFriendRequestPayload struct {
	ID string `json:"id"`
}

type Notifier interface {
	NotifyUser(userId string, payload any)
}

func AcceptFriendRequest(ctx context.Context, db *databases.Container, hub Notifier, p *AcceptFriendRequestPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.ID == "" {
		return &httputil.ErrorResponse{Err: errors.New("request id is missing"), Code: http.StatusBadRequest}
	}

	var addresseeID, requesterID string
	err = db.Postgres.QueryRow(ctx, `SELECT addressee_id, requester_id FROM friends WHERE id = $1`, p.ID).Scan(&addresseeID, &requesterID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("friend request not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if addresseeID != userID {
		return &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
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

	_, err = tx.Exec(ctx, `UPDATE friends SET status = 'accepted', updated_at = NOW() WHERE id = $1`, p.ID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err = tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// The addressee (current user) already sees the accept in their own UI
	// via the request's response. Push the requester a nudge so their
	// pending/friends lists update live instead of waiting on a reload.
	if hub != nil {
		hub.NotifyUser(requesterID, map[string]string{
			"type": "friend_accepted",
		})
	}

	return nil
}
