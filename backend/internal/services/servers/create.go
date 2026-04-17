package servers

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type ServerPayload struct {
	Name    string `json:"name"`
	OwnerId string `json:"owner_id"`
}

func CreateServer(ctx context.Context, container *databases.Container, srv *ServerPayload) *httputil.ErrorResponse {
	rows, err := container.Postgres.Query(ctx, "insert into servers(name,created_by,banner_colors) values($1,$2,$3) returning id;", srv.Name, srv.OwnerId, []string{"#1f1f1f", "#3a3a3a"})
	if err != nil {
		fmt.Println("Failed to create servers -> ", err.Error())
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	var serverId string
	for rows.Next() {
		if err := rows.Scan(&serverId); err != nil {
			fmt.Println(err.Error())
			return &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}

	if serverId == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("Failed to create server"),
			Code: http.StatusInternalServerError,
		}
	}

	if err := queue.PushJob(ctx, container.Redis, queue.CreateChannel, queue.CreateChannelPayload{
		ServerId:  serverId,
		CreatedBy: srv.OwnerId,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	var memberID string
	if err := container.Postgres.QueryRow(ctx, "INSERT INTO members(server_id,user_id) VALUES($1,$2) RETURNING id", serverId, srv.OwnerId).Scan(&memberID); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if err := queue.PushJob(ctx, container.Redis, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: serverId,
		UserID:   srv.OwnerId,
		MemberID: memberID,
	}); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
