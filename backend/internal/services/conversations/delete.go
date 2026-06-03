package conversations

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type DeleteConversationPayload struct {
	ChannelID string `json:"channel_id"`
}

func DeleteConversation(ctx context.Context, db *databases.Container, p DeleteConversationPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("conversation id is missing"), Code: http.StatusBadRequest}
	}

	cmd, err := db.Postgres.Exec(ctx, `
		DELETE FROM channel_members AS cm
		USING channels AS ch
		WHERE cm.channel_id = ch.id
			AND ch.id = $1
			AND cm.user_id = $2
			AND ch.server_id IS NULL
			AND ch.channel_type IN ('dm', 'group_dm')
	`, p.ChannelID, userID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if cmd.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("conversation not found"), Code: http.StatusNotFound}
	}

	if _, err := db.Postgres.Exec(ctx, `
		DELETE FROM channels AS ch
		WHERE ch.id = $1
			AND ch.server_id IS NULL
			AND NOT EXISTS (
				SELECT 1
				FROM channel_members AS cm
				WHERE cm.channel_id = ch.id
			)
	`, p.ChannelID); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
