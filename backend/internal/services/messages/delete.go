package messages

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type BroadcastDeleter interface {
	BroadcastDelete(serverId, channelId, messageId string)
}

type DeleteMessagePayload struct {
	Ctx              context.Context
	Hub              BroadcastDeleter
	db               *databases.Container
	DeleteImgPayload queue.DeleteImagePayload
}

func DeleteMessage(p *DeleteMessagePayload) *httputil.ErrorResponse {
	if _, deleteErr := p.db.Postgres.Exec(p.Ctx, "DELETE FROM messages WHERE id = $1", p.DeleteImgPayload.ID); deleteErr != nil {
		return &httputil.ErrorResponse{
			Err:  deleteErr,
			Code: http.StatusInternalServerError,
		}
	}
	if p.DeleteImgPayload.PublicID != "" {
		if err := queue.PushJob(p.Ctx, p.db.Redis, queue.DeleteImage, p); err != nil {
			return &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}
	p.Hub.BroadcastDelete(p.DeleteImgPayload.ServerID, p.DeleteImgPayload.ChannelID, p.DeleteImgPayload.ID)
	return nil
}
