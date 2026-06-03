package messages

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type EditMessagePayload struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	ChannelID string `json:"channel_id"`
	ServerID  string `json:"server_id"`
}

func EditMessage(ctx context.Context, db *databases.Container, p *EditMessagePayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.ID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}

	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel id is missing"), Code: http.StatusBadRequest}
	}

	var createdAt time.Time
	var msgUserID string
	err = db.Postgres.QueryRow(ctx, `SELECT user_id, created_at FROM messages WHERE id = $1 AND channel_id = $2`, p.ID, p.ChannelID).Scan(&msgUserID, &createdAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("message not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if msgUserID != userID {
		return &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}

	if time.Since(createdAt) > 5*time.Minute {
		return &httputil.ErrorResponse{Err: errors.New("message can no longer be edited"), Code: http.StatusForbidden}
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

	_, err = tx.Exec(ctx, `UPDATE messages SET content = $1, updated_at = NOW() WHERE id = $2`, p.Content, p.ID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err = tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
