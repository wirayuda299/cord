package pin

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type PinnedMessageResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Content  string `json:"content"`
	UserID   string `json:"user_id"`
}

func GetAllPinnedMessage(ctx context.Context, db *databases.Container, channelId string) ([]PinnedMessageResponse, *httputil.ErrorResponse) {
	var pinnedMessages []PinnedMessageResponse
	if channelId == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("Channel ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	rows, err := db.Postgres.Query(ctx, "SELECT m.id,m.content,u.username,u.id from pinned_messages as cpm left join messages as m on m.id = cpm.message_id left join users as u on m.user_id = u.id where cpm.channel_id = $1", channelId)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	defer rows.Close()

	for rows.Next() {
		var m PinnedMessageResponse
		if err := rows.Scan(&m.ID, &m.Content, &m.Username, &m.UserID); err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
		pinnedMessages = append(pinnedMessages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return pinnedMessages, nil
}
