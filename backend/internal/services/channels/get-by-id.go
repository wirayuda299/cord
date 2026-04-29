package channels

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type ChannelResponse struct {
	ChannelID string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"channel_type"`
	Topic     string `json:"topic"`
}

func GetChannelById(ctx context.Context, db *databases.Container, channelId string) (*ChannelResponse, *httputil.ErrorResponse) {
	if channelId == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("channel ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	var channel ChannelResponse
	if err := db.Postgres.QueryRow(ctx, "SELECT id,name,COALESCE(topic,''),channel_type from channels where id = $1", channelId).Scan(&channel.ChannelID, &channel.Name, &channel.Topic, &channel.Type); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return &channel, nil
}
