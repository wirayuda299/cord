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
	ServerID  string `json:"server_id"`
	Type      string `json:"channel_type"`
	Topic     string `json:"topic"`
	CreatedBy string `json:"created_by"`
}

func GetChannelById(ctx context.Context, db *databases.Container, channelId string) (*ChannelResponse, *httputil.ErrorResponse) {
	if channelId == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("channel ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	var channel ChannelResponse
	if err := db.Postgres.QueryRow(ctx, `
		SELECT
			c.id::text,
			COALESCE(c.name, ''),
			COALESCE(c.server_id::text, ''),
			COALESCE(c.topic, ''),
			c.channel_type::text,
			s.created_by
		FROM channels as c
		LEFT JOIN servers as s on c.server_id = s.id
		WHERE c.id = $1
	`, channelId).Scan(&channel.ChannelID, &channel.Name, &channel.ServerID, &channel.Topic, &channel.Type, &channel.CreatedBy); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return &channel, nil
}
