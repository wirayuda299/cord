package threads

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/services/messageutil"
	"github.com/wirayuda299/backend/internal/utils"
)

const queryAllThreadMessages = `SELECT
    m.id,
    m.content,
    COALESCE(sp.username, u.username) as username,
    COALESCE(m.image_url, '') AS image_url,
    COALESCE(m.image_asset_id, '') AS image_asset_id,
    m.user_id,
    th.channel_id as channel_id,
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
    th.id as thread_id
    FROM messages as m
    JOIN threads AS th ON th.id = m.thread_id
    LEFT JOIN channels as ch ON ch.id = th.channel_id
    LEFT JOIN server_profile as sp ON sp.server_id = ch.server_id AND sp.user_id = m.user_id
    LEFT JOIN messages as pm ON m.parent_msg_id = pm.id
    JOIN users as u ON m.user_id = u.id
    LEFT JOIN users as pu ON pm.user_id = pu.id
    LEFT JOIN server_profile as psp ON psp.server_id = ch.server_id AND psp.user_id = pm.user_id
    WHERE m.thread_id = $1
    ORDER BY m.created_at ASC;`

func GetAllThreadMessages(ctx context.Context, db *databases.Container, threadID string) ([]services.MessageRow, *httputil.ErrorResponse) {
	_, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if threadID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("thread ID is missing"), Code: http.StatusBadRequest}
	}

	var channelID string
	err = db.Postgres.QueryRow(ctx, "SELECT channel_id::text FROM threads WHERE id = $1", threadID).Scan(&channelID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: errors.New("thread not found"), Code: http.StatusNotFound}
	}

	// Thread messages inherit their parent channel's access boundary —
	// without this, any authenticated user who obtains a thread ID could
	// read the full message content of any thread in any server.
	allowed, accessErr := members.VerifyChannelAccess(ctx, db, channelID)
	if accessErr != nil {
		return nil, &httputil.ErrorResponse{Err: accessErr, Code: http.StatusInternalServerError}
	}
	if !allowed {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have access to this thread"), Code: http.StatusForbidden}
	}

	rows, err := db.Postgres.Query(ctx, queryAllThreadMessages, threadID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return messageutil.ScanMessages(rows)
}
