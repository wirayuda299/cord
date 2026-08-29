package messages

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/messageutil"
)

// server_profile is joined against `ch.server_id` (resolved once from the
// $1 channelID param, same for every row) so a per-server nickname/avatar
// override shows up in chat history the same way it already does in the
// members list. Falls back to the global user profile for DMs (ch.server_id
// is NULL there) or when no override exists.
const queryAllMessages = `SELECT
    m.id,
    m.content,
    COALESCE(sp.username, u.username) as username,
    COALESCE(m.image_url, '') AS image_url,
    COALESCE(m.image_asset_id, '') AS image_asset_id,
    m.user_id,
    m.channel_id,
    m.created_at,
    m.updated_at,
    m.parent_msg_id,
    pm.content AS parent_content,
    COALESCE(psp.username, pu.username) AS parent_username,
    COALESCE(sp.avatar, u.avatar_url, '') as avatar,
    COALESCE(
        (SELECT json_agg(json_build_object('user_id', r.user_id, 'emoji', r.emoji))
         FROM reactions r WHERE r.message_id = m.id),
        '[]'::json
    ) as reactions,
    COALESCE(
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
         FROM threads as t where t.message_id = m.id),
        '[]'::json
    ) as threads,
    m.thread_id
    FROM messages as m
    JOIN users as u ON m.user_id = u.id
    LEFT JOIN channels as ch ON ch.id = $1
    LEFT JOIN server_profile as sp ON sp.server_id = ch.server_id AND sp.user_id = m.user_id
    LEFT JOIN messages as pm ON m.parent_msg_id = pm.id
    LEFT JOIN users as pu ON pm.user_id = pu.id
    LEFT JOIN server_profile as psp ON psp.server_id = ch.server_id AND psp.user_id = pm.user_id
    WHERE m.channel_id = $1
    ORDER BY m.created_at ASC;`

func GetAllMessages(ctx context.Context, db *databases.Container, channelID string) ([]services.MessageRow, *httputil.ErrorResponse) {
	if channelID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("channel ID is missing"), Code: http.StatusBadRequest}
	}

	rows, err := db.Postgres.Query(ctx, queryAllMessages, channelID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return messageutil.ScanMessages(rows)
}
