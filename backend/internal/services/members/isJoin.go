package members

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

func IsUserJoinedServer(ctx context.Context, db *databases.Container, serverID string) (bool, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}

	if serverID == "" {
		return false, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	var joined bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from members where server_id = $1 and user_id = $2)", serverID, userID).Scan(&joined)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return joined, nil
}
