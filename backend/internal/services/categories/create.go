package categories

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateCategoryPayload struct {
	Name      string `json:"name"`
	ServerID  string `json:"server_id"`
	CreatedBy string `json:"created_by"`
}

func CreateCategory(ctx context.Context, db *databases.Container, payload *CreateCategoryPayload) *httputil.ErrorResponse {
	if payload.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("name is required"), Code: http.StatusBadRequest}
	}
	if payload.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}
	if payload.CreatedBy == "" {
		return &httputil.ErrorResponse{Err: errors.New("created_by is required"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx,
		"INSERT INTO category(name, server_id, created_by) VALUES($1, $2, $3)",
		payload.Name, payload.ServerID, payload.CreatedBy,
	)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
