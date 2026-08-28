package servers

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/utils"
)

type JoinServerPayload struct {
	ServerId string `json:"server_id"`
}

type ServerInfo struct {
	CreatedBy string
}

func JoinServer(ctx context.Context, db *databases.Container, p *JoinServerPayload) *httputil.ErrorResponse {
	if p.ServerId == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			log.Println("error rollback -> ", err)
		}
	}()

	var server ServerInfo
	err = tx.QueryRow(ctx, "SELECT created_by from servers where id = $1", p.ServerId).Scan(&server.CreatedBy)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("Server not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if server.CreatedBy == userID {
		return &httputil.ErrorResponse{Err: errors.New("you are own the server"), Code: http.StatusBadRequest}
	}

	var isBanned bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bans WHERE server_id = $1 AND user_id = $2)", p.ServerId, userID).Scan(&isBanned)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if isBanned {
		return &httputil.ErrorResponse{Err: errors.New("you are banned from this server"), Code: http.StatusForbidden}
	}

	var userExist bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users where id = $1)", userID).Scan(&userExist)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !userExist {
		return &httputil.ErrorResponse{Err: errors.New("User not found"), Code: http.StatusNotFound}
	}

	var memberID string
	err = tx.QueryRow(ctx, "INSERT INTO members(server_id,user_id) VALUES($1,$2) RETURNING id", p.ServerId, userID).Scan(&memberID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := queue.PushJob(ctx, db.Redis, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: p.ServerId,
		MemberID: memberID,
		UserID:   userID,
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
