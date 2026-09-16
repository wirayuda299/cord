package servers

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/utils"
)

type ServerPayload struct {
	Name string `json:"name"`
}

func CreateServer(ctx context.Context, container *databases.Container, srv *ServerPayload) *httputil.ErrorResponse {
	if srv.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("server name is missing"), Code: http.StatusBadRequest}
	}

	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// The server row and its owner's membership row must land together —
	// every permission check (including "am I the owner") and the server
	// list UI go through `members`, so a server that exists without one is
	// an orphaned row nothing can reach again.
	tx, err := container.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			fmt.Println("error rollback create server -> ", err.Error())
		}
	}()

	var serverID string
	if err := tx.QueryRow(ctx, "insert into servers(name,created_by,banner_colors) values($1,$2,$3) returning id;", srv.Name, userID, []string{"#1f1f1f", "#3a3a3a"}).Scan(&serverID); err != nil {
		fmt.Println("Failed to create servers -> ", err.Error())
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	var memberID string
	if err := tx.QueryRow(ctx, "INSERT INTO members(server_id,user_id) VALUES($1,$2) RETURNING id", serverID, userID).Scan(&memberID); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := tx.Commit(ctx); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Job enqueueing is deliberately outside the transaction: these are
	// async, best-effort side effects (default channels/profile/safety
	// setup run in the queue worker), not something a DB transaction needs
	// to make atomic with the rows above.
	if err := queue.PushJob(ctx, container.Jobs, queue.CreateChannel, queue.CreateChannelPayload{
		ServerId:  serverID,
		CreatedBy: userID,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if err := queue.PushJob(ctx, container.Jobs, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: serverID,
		MemberID: memberID,
		UserID:   userID,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if err := queue.PushJob(ctx, container.Jobs, queue.CreateDefaultServerSafety, &queue.CreateDefaultServerSafetyPayload{
		ServerID:  serverID,
		CreatedBy: userID,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
