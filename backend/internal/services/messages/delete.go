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

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        p.Ctx,
		Db:         p.DB,
		ServerID:   p.DeleteImgPayload.ServerID,
		Permission: "manage_message",
	})

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete message"), Code: http.StatusUnauthorized}
	}
	if _, deleteErr := p.DB.Postgres.Exec(p.Ctx, "DELETE FROM messages WHERE id = $1", p.DeleteImgPayload.ID); deleteErr != nil {
		return &httputil.ErrorResponse{
			Err:  deleteErr,
			Code: http.StatusInternalServerError,
		}
	}
	if p.DeleteImgPayload.PublicID != "" {
		if err := queue.PushJob(p.Ctx, p.DB.Redis, queue.DeleteImage, p.DeleteImgPayload); err != nil {
			return &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}
	if p.Hub != nil {
		p.Hub.BroadcastDelete(p.DeleteImgPayload.ServerID, p.DeleteImgPayload.ChannelID, p.DeleteImgPayload.ID)
	}
	return nil
}
