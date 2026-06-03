package pin

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type PinMessagePayload struct {
	MessageID string `json:"msg_id"`
	ChannelID string `json:"channel_id"`
}

func PinMessage(ctx context.Context, db *databases.Container, p *PinMessagePayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		log.Println("after utils get session error -> ", err.Error())
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel ID is missing"), Code: http.StatusBadRequest}
	}

	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message ID is missing"), Code: http.StatusBadRequest}
	}
	if _, err := db.Postgres.Exec(ctx, "INSERT INTO pinned_messages(message_id, channel_id,pinned_by) values($1,$2,$3)", p.MessageID, p.ChannelID, userID); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
