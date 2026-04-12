package pin

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type PinMessagePayload struct {
	PinnedBy  string `json:"pinned_by"`
	MessageID string `json:"msg_id"`
	ChannelID string `json:"channel_id"`
}

func PinMessage(ctx context.Context, db *databases.Container, p *PinMessagePayload) *httputil.ErrorResponse {

	if _, err := db.Postgres.Exec(ctx, "INSERT INTO channel_pinned_messages(message_id, channel_id,pinned_by) values($1,$2,$3)", p.MessageID, p.ChannelID, p.PinnedBy); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
