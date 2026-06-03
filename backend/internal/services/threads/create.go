package threads

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type CreateThreadPayload struct {
	ChannelID string `json:"channel_id"`
	Name      string `json:"name"`
	MessageID string `json:"message_id"`
}

func CreateThread(ctx context.Context, db *databases.Container, p *CreateThreadPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if p == nil {
		return &httputil.ErrorResponse{Err: errors.New("payload is missing"), Code: http.StatusBadRequest}
	}

	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel id is missing"), Code: http.StatusBadRequest}
	}

	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("thread name is missing"), Code: http.StatusBadRequest}
	}

	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message id is missing"), Code: http.StatusBadRequest}
	}

	_, err = db.Postgres.Exec(ctx, "INSERT INTO threads(channel_id,name,created_by,message_id) values($1,$2,$3,$4)", p.ChannelID, p.Name, userID, p.MessageID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
