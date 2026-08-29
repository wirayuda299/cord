package messages

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type ReactionPayload struct {
	MessageID string `json:"message_id"`
	Emoji     string `json:"emoji"`
}

func checkUserBanForMessage(ctx context.Context, db *databases.Container, messageID string, userID string) *httputil.ErrorResponse {
	var serverID *string
	err := db.Postgres.QueryRow(ctx, `
		SELECT COALESCE(
			(SELECT server_id::text FROM channels WHERE id = m.channel_id),
			(SELECT c.server_id::text FROM threads t JOIN channels c ON t.channel_id = c.id WHERE t.id = m.thread_id)
		)
		FROM messages m
		WHERE m.id = $1
	`, messageID).Scan(&serverID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if serverID != nil && *serverID != "" {
		var isBanned bool
		err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bans WHERE server_id = $1 AND user_id = $2)", *serverID, userID).Scan(&isBanned)
		if err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		if isBanned {
			return &httputil.ErrorResponse{Err: errors.New("you are banned from this server"), Code: http.StatusForbidden}
		}
	}
	return nil
}

func AddReaction(ctx context.Context, db *databases.Container, p *ReactionPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}
	if p.Emoji == "" {
		return &httputil.ErrorResponse{Err: errors.New("emoji is missing"), Code: http.StatusBadRequest}
	}

	if errRes := checkUserBanForMessage(ctx, db, p.MessageID, userID); errRes != nil {
		return errRes
	}

	var exists bool
	err = db.Postgres.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM messages WHERE id = $1)`, p.MessageID).Scan(&exists)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !exists {
		return &httputil.ErrorResponse{Err: errors.New("message not found"), Code: http.StatusNotFound}
	}

	_, err = db.Postgres.Exec(ctx, `
		INSERT INTO reactions (message_id, user_id, emoji)
		VALUES ($1, $2, $3)
		ON CONFLICT (message_id, user_id, emoji) DO NOTHING
	`, p.MessageID, userID, p.Emoji)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}

func RemoveReaction(ctx context.Context, db *databases.Container, p *ReactionPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}
	if p.Emoji == "" {
		return &httputil.ErrorResponse{Err: errors.New("emoji is missing"), Code: http.StatusBadRequest}
	}

	if errRes := checkUserBanForMessage(ctx, db, p.MessageID, userID); errRes != nil {
		return errRes
	}

	_, err = db.Postgres.Exec(ctx, `
		DELETE FROM reactions
		WHERE message_id = $1 AND user_id = $2 AND emoji = $3
	`, p.MessageID, userID, p.Emoji)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}

