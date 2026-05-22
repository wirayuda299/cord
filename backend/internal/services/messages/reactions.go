package messages

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Reaction struct {
	UserID string `json:"user_id"`
	Emoji  string `json:"emoji"`
}

type ReactionPayload struct {
	MessageID string `json:"message_id"`
	UserID    string `json:"user_id"`
	Emoji     string `json:"emoji"`
}

func AddReaction(ctx context.Context, db *databases.Container, p *ReactionPayload) *httputil.ErrorResponse {
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}
	if p.UserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user id is missing"), Code: http.StatusBadRequest}
	}
	if p.Emoji == "" {
		return &httputil.ErrorResponse{Err: errors.New("emoji is missing"), Code: http.StatusBadRequest}
	}

	var exists bool
	err := db.Postgres.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM messages WHERE id = $1)`, p.MessageID).Scan(&exists)
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
	`, p.MessageID, p.UserID, p.Emoji)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}

func RemoveReaction(ctx context.Context, db *databases.Container, p *ReactionPayload) *httputil.ErrorResponse {
	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is required"), Code: http.StatusBadRequest}
	}
	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}
	if p.UserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user id is missing"), Code: http.StatusBadRequest}
	}
	if p.Emoji == "" {
		return &httputil.ErrorResponse{Err: errors.New("emoji is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, `
		DELETE FROM reactions
		WHERE message_id = $1 AND user_id = $2 AND emoji = $3
	`, p.MessageID, p.UserID, p.Emoji)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}

func GetReactionsByMessageID(ctx context.Context, db *databases.Container, messageID string) ([]Reaction, *httputil.ErrorResponse) {
	if messageID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT user_id, emoji FROM reactions WHERE message_id = $1
	`, messageID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	reactions := make([]Reaction, 0)
	for rows.Next() {
		var r Reaction
		if err := rows.Scan(&r.UserID, &r.Emoji); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		reactions = append(reactions, r)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return reactions, nil
}

func GetReactionsByChannelID(ctx context.Context, db *databases.Container, channelID string) (map[string][]Reaction, *httputil.ErrorResponse) {
	if channelID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("channel id is missing"), Code: http.StatusBadRequest}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT r.message_id, r.user_id, r.emoji
		FROM reactions r
		JOIN messages m ON m.id = r.message_id
		WHERE m.channel_id = $1
	`, channelID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	reactions := make(map[string][]Reaction)
	for rows.Next() {
		var msgID string
		var r Reaction
		if err := rows.Scan(&msgID, &r.UserID, &r.Emoji); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		reactions[msgID] = append(reactions[msgID], r)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return reactions, nil
}
