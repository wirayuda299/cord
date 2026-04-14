package channels

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateChannelPayload struct {
	Name       string  `json:"name"`
	Type       string  `json:"type"`
	CreatedBy  string  `json:"created_by"`
	CategoryID *string `json:"category_id"`
	ServerID   string  `json:"server_id"`
}

func CreateChannel(ctx context.Context, db *databases.Container, p *CreateChannelPayload) *httputil.ErrorResponse {
	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("Channel name is required"), Code: http.StatusBadRequest}
	}

	if p.Type == "" {
		return &httputil.ErrorResponse{Err: errors.New("Channel type is required"), Code: http.StatusBadRequest}
	}

	if p.CreatedBy == "" {
		return &httputil.ErrorResponse{Err: errors.New("User ID is required"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is required"), Code: http.StatusBadRequest}
	}
	if _, err := db.Postgres.Exec(ctx, "INSERT INTO channels(name,channel_type,created_by,category_id,server_id) values($1,$2,$3,$4,$5)", p.Name, p.Type, p.CreatedBy, p.CategoryID, p.ServerID); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
