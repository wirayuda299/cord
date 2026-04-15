package members

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

func IsUserJoinedServer(ctx context.Context, db *databases.Container, user_id string, server_id string) (bool, *httputil.ErrorResponse) {
	if user_id == "" {
		return false, &httputil.ErrorResponse{Err: errors.New("User ID is missing"), Code: http.StatusBadRequest}
	}

	if server_id == "" {
		return false, &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	var joined bool
	err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from members where server_id = $1 and user_id = $2)", server_id, user_id).Scan(&joined)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return joined, nil
}
