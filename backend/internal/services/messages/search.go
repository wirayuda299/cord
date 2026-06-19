package messages

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type MessageRes struct {
	ID        string  `json:"id"`
	Content   string  `json:"content"`
	ThreadID  *string `json:"thread_id"`
	Username  string  `json:"username"`
	AvatarURL string  `json:"avatar_url"`
}

func SearchMessage(ctx context.Context, db *databases.Container, query, serverID, channelID string) ([]MessageRes, *httputil.ErrorResponse) {
	if query == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("query is missing"), Code: http.StatusBadRequest}
	}

	sqlQuery := `
		SELECT
		m.id,
		m.content,
		m.thread_id,
		COALESCE(sp.username, u.username),
		COALESCE(sp.avatar, '')
		FROM messages as m
		JOIN users as u on m.user_id = u.id
		LEFT JOIN server_profile as sp on sp.server_id = $1 and sp.user_id = m.user_id
		WHERE to_tsvector('simple', m.content) @@ plainto_tsquery('simple', $2) and m.thread_id is null and m.channel_id = $3
		`

	rows, err := db.Postgres.Query(ctx, sqlQuery, serverID, query, channelID)

	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()

	messages := make([]MessageRes, 0)

	for rows.Next() {

		var m MessageRes

		err := rows.Scan(&m.ID, &m.Content, &m.ThreadID, &m.Username, &m.AvatarURL)
		if err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		messages = append(messages, m)

	}

	if rows.Err() != nil {
		return nil, &httputil.ErrorResponse{Err: rows.Err(), Code: http.StatusInternalServerError}
	}

	return messages, nil

}
