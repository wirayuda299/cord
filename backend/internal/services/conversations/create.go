package conversations

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateConversationPayload struct {
	UserA string `json:"user_a"`
	UserB string `json:"user_b"`
}

func makeDMKey(userA, userB string) string {
	if userA < userB {
		return userA + ":" + userB
	}
	return userB + ":" + userA
}

func CreateConversation(ctx context.Context, db *databases.Container, p CreateConversationPayload) *httputil.ErrorResponse {

	dmKey := makeDMKey(p.UserA, p.UserB)
	_, err := db.Postgres.Exec(ctx, `WITH dm_channel AS (
			  INSERT INTO channels (
			    name,
			    channel_type,
			    server_id,
			    dm_key,
			    created_by
			  )
			  VALUES (
			    NULL,
			    'dm',
			    NULL,
			    $3,
			    $1
			  )
			  ON CONFLICT (dm_key) WHERE channel_type = 'dm'
			  DO UPDATE SET dm_key = EXCLUDED.dm_key
			  RETURNING id
			),
			members_insert AS (
			  INSERT INTO channel_members (channel_id, user_id)
			  SELECT id, $1 FROM dm_channel
			  UNION
			  SELECT id, $2 FROM dm_channel
			  ON CONFLICT DO NOTHING
			)
			SELECT id FROM dm_channel;`, p.UserA, p.UserB, dmKey)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
