package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type JoinServerPayload struct {
	ServerId string `json:"server_id"`
	UserId   string `json:"user_id"`
}

func JoinServer(ctx context.Context, db *databases.Container, p *JoinServerPayload) *httputil.ErrorResponse {
	if p.ServerId == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	if p.UserId == "" {
		return &httputil.ErrorResponse{Err: errors.New("User ID is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, "INSERT INTO members(server_id,user_id) values($1,$2)", p.ServerId, p.UserId)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := queue.PushJob(ctx, db.Redis, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: p.ServerId,
		UserID:   p.UserId,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
