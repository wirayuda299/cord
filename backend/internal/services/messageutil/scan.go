package messageutil

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
)

func ScanMessages(rows pgx.Rows) ([]services.MessageRow, *httputil.ErrorResponse) {
	defer rows.Close()
	messages := make([]services.MessageRow, 0)

	for rows.Next() {
		var m services.MessageRow
		var reactionsJSON, threadsJSON []byte

		if err := rows.Scan(
			&m.ID,
			&m.Content,
			&m.Username,
			&m.ImageURL,
			&m.ImageAssetID,
			&m.UserID,
			&m.ChannelID,
			&m.CreatedAt,
			&m.UpdatedAt,
			&m.ParentMsgID,
			&m.ParentContent,
			&m.ParentUsername,
			&m.Avatar,
			&reactionsJSON,
			&threadsJSON,
			&m.ThreadID,
		); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		if err := unmarshalIfNonEmpty(reactionsJSON, &m.Reactions); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		if err := unmarshalIfNonEmpty(threadsJSON, &m.Threads); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		messages = append(messages, m)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return messages, nil
}

func unmarshalIfNonEmpty(data []byte, v any) error {
	if len(data) > 0 {
		return json.Unmarshal(data, v)
	}
	return nil
}
