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
	ctx              context.Context
	hub              BroadcastDeleter
	container        *databases.Container
	deleteImgPayload queue.DeleteImagePayload
}

func DeleteMessage(p *DeleteMessagePayload) *httputil.ErrorResponse {

	if _, deleteErr := p.container.Postgres.Exec(p.ctx, "DELETE FROM messages WHERE id = $1", p.deleteImgPayload.ID); deleteErr != nil {
		return &httputil.ErrorResponse{
			Err:  deleteErr,
			Code: http.StatusInternalServerError,
		}
	}
	if p.deleteImgPayload.PublicID != "" {
		if err := queue.PushJob(p.ctx, p.container.Redis, queue.DeleteImage, p); err != nil {
			return &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}
	p.hub.BroadcastDelete(p.deleteImgPayload.ServerID, p.deleteImgPayload.ChannelID, p.deleteImgPayload.ID)
	return nil
}
