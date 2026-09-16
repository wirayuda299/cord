package messages

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type BroadcastDeleter interface {
	BroadcastDelete(serverId, channelId, messageId string)
	BroadcastMessages(serverId, channelId string, messages []services.MessageRow)
}

type DeleteMessagePayload struct {
	Ctx              context.Context
	Hub              BroadcastDeleter
	DB               *databases.Container
	DeleteImgPayload queue.DeleteImagePayload
}

func DeleteMessage(p *DeleteMessagePayload) *httputil.ErrorResponse {

	userID, err := utils.GetSession(p.Ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// COALESCE is required: a DM channel's server_id is NULL by schema
	// design, and scanning SQL NULL into a non-pointer string errors out —
	// which previously made every DM delete fail with "message not found"
	// before authorization was even evaluated.
	var realChannelID, realServerID, authorID string
	if err := p.DB.Postgres.QueryRow(p.Ctx,
		"SELECT c.id::text, COALESCE(c.server_id::text, ''), m.user_id FROM messages m JOIN channels c ON c.id = m.channel_id WHERE m.id = $1",
		p.DeleteImgPayload.ID,
	).Scan(&realChannelID, &realServerID, &authorID); err != nil {
		return &httputil.ErrorResponse{Err: errors.New("message not found"), Code: http.StatusNotFound}
	}

	// The client always sends "dm" for a DM channel's server_id (see
	// DM_SCOPE_ID in the frontend) — normalize the DB's NULL-turned-""
	// to match, both for the equality check below and for the hub
	// broadcast, which routes DM traffic under the "dm" bucket.
	if realServerID == "" {
		realServerID = "dm"
	}

	if realServerID != p.DeleteImgPayload.ServerID {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete message"), Code: http.StatusUnauthorized}
	}

	// The author can always remove their own message (same rule as
	// EditMessage). Everyone else needs manage_message — which is also the
	// only path left for DMs, since HasPermission always returns false for
	// an empty/"dm" server ID (there are no roles there), so without the
	// author branch nobody could ever delete a DM message.
	if authorID != userID {
		hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
			Ctx:        p.Ctx,
			Db:         p.DB,
			ServerID:   realServerID,
			Permission: "manage_message",
		})
		if err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		if !hasPerm {
			return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete message"), Code: http.StatusUnauthorized}
		}
	}

	if tag, deleteErr := p.DB.Postgres.Exec(p.Ctx, "DELETE FROM messages WHERE id = $1 AND channel_id = $2", p.DeleteImgPayload.ID, realChannelID); deleteErr != nil {
		return &httputil.ErrorResponse{
			Err:  deleteErr,
			Code: http.StatusInternalServerError,
		}
	} else if tag.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("message not found"), Code: http.StatusNotFound}
	}
	if p.DeleteImgPayload.PublicID != "" {
		if err := queue.PushJob(p.Ctx, p.DB.Jobs, queue.DeleteImage, p.DeleteImgPayload); err != nil {
			return &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}
	if p.Hub != nil {
		p.Hub.BroadcastDelete(realServerID, realChannelID, p.DeleteImgPayload.ID)
	}
	return nil
}
