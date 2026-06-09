package safety

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

func GetServerSafetySettings(ctx context.Context, db *databases.Container, server_id string) (string, *httputil.ErrorResponse) {
	if server_id == "" {
		return "", &httputil.ErrorResponse{Err: errors.New("server id is missing"), Code: http.StatusBadRequest}
	}

	var level string

	err := db.Postgres.QueryRow(ctx, "SELECT level from safety where server_id = $1", server_id).Scan(&level)

	if err != nil {
		return "", &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return level, nil
}
