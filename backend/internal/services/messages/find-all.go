package messages

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
)

func GetAllMessages(ctx context.Context, db *databases.Container, channelID string) ([]services.MessageRow, *httputil.ErrorResponse) {
	if channelID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("channel ID is missing"), Code: http.StatusBadRequest}
	}

	rows, err := db.Postgres.Query(ctx, `SELECT
    m.id,
    m.content,
    u.username,
    COALESCE(m.image_url, '') AS image_url,
    COALESCE(m.image_asset_id, '') AS image_asset_id,
    m.user_id,
    m.channel_id,
    m.created_at,
    m.updated_at,
    m.parent_msg_id,
    pm.content AS parent_content,
    pu.username AS parent_username,
    COALESCE(u.avatar_url, '') as avatar,
    COALESCE(
        (SELECT json_agg(json_build_object('user_id', r.user_id, 'emoji', r.emoji))
         FROM reactions r WHERE r.message_id = m.id),
        '[]'::json
    ) as reactions,
    COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
         FROM threads as t where t.message_id = m.id),
        '[]'::json
    ) as threads
    FROM messages as m
    JOIN users as u ON m.user_id = u.id
    LEFT JOIN messages as pm ON m.parent_msg_id = pm.id
    LEFT JOIN users as pu ON pm.user_id = pu.id
    WHERE m.channel_id = $1
    ORDER BY m.created_at ASC;`, channelID)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	defer rows.Close()
	messages := make([]services.MessageRow, 0)

	for rows.Next() {
		var m services.MessageRow
		var reactionsJSON []byte
		var threadsJSON []byte
		err = rows.Scan(
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
		)
		if err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
		if len(reactionsJSON) > 0 {
			json.Unmarshal(reactionsJSON, &m.Reactions)
		}

		if len(threadsJSON) > 0 {
			json.Unmarshal(threadsJSON, &m.Threads)
		}

		messages = append(messages, m)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return messages, nil
}
