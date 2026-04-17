package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type JoinServerPayload struct {
	ServerId string `json:"server_id"`
	UserId   string `json:"user_id"`
}

type ServerInfo struct {
	CreatedBy string
}

func JoinServer(ctx context.Context, db *databases.Container, p *JoinServerPayload) *httputil.ErrorResponse {
	if p.ServerId == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	if p.UserId == "" {
		return &httputil.ErrorResponse{Err: errors.New("User ID is missing"), Code: http.StatusBadRequest}
	}

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	var server ServerInfo
	err = tx.QueryRow(ctx, "SELECT created_by from servers where id = $1", p.ServerId).Scan(&server.CreatedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("Server not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if server.CreatedBy == p.UserId {
		return &httputil.ErrorResponse{Err: errors.New("You are own the server"), Code: http.StatusBadRequest}
	}

	var userExist bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users where id = $1)", p.UserId).Scan(&userExist)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !userExist {
		return &httputil.ErrorResponse{Err: errors.New("User not found"), Code: http.StatusNotFound}
	}

	var memberID string
	err = tx.QueryRow(ctx, "INSERT INTO members(server_id,user_id) VALUES($1,$2) RETURNING id", p.ServerId, p.UserId).Scan(&memberID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := queue.PushJob(ctx, db.Redis, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: p.ServerId,
		UserID:   p.UserId,
		MemberID: memberID,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
