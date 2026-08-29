package conversations

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
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

	var anyMembersLeft bool
	if err := db.Postgres.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM channel_members WHERE channel_id = $1)`, p.ChannelID).Scan(&anyMembersLeft); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if anyMembersLeft {
		// Other participants are still in this conversation — it (and its
		// messages) stay intact for them, so there's nothing to delete yet.
		return nil
	}

	// Collect image asset IDs before the cascade delete wipes the message
	// rows that reference them — Postgres can't clean up Cloudinary for us.
	var assetIDs []string
	rows, err := db.Postgres.Query(ctx, `SELECT image_asset_id FROM messages WHERE channel_id = $1 AND image_asset_id != ''`, p.ChannelID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		assetIDs = append(assetIDs, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	deleteCmd, err := db.Postgres.Exec(ctx, `
		DELETE FROM channels AS ch
		WHERE ch.id = $1
			AND ch.server_id IS NULL
			AND NOT EXISTS (
				SELECT 1
				FROM channel_members AS cm
				WHERE cm.channel_id = ch.id
			)
	`, p.ChannelID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Only clean up Cloudinary if the channel actually got deleted — a
	// member could have rejoined between the check above and this delete,
	// in which case the NOT EXISTS guard skipped it and these images are
	// still in use.
	if deleteCmd.RowsAffected() > 0 {
		for _, id := range assetIDs {
			_ = queue.PushJob(ctx, db.Redis, queue.DeleteImage, &queue.DeleteImagePayload{PublicID: id})
		}
	}

	return nil
}
