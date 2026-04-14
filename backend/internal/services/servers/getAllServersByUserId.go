package servers

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type ServerResponse struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Logo string `json:"logo"`
}

func GetAllServersByUserId(ctx context.Context, db *databases.Container, userId string) ([]ServerResponse, *httputil.ErrorResponse) {

	if userId == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("User ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	var servers []ServerResponse

	rows, err := db.Postgres.Query(ctx, `select id, name, COALESCE(logo, '') as logo from servers where owner_id = $1`, userId)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	defer rows.Close()

	for rows.Next() {
		var server ServerResponse
		if err := rows.Scan(&server.Id, &server.Name, &server.Logo); err != nil {
			log.Println(err)
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
		servers = append(servers, server)
	}
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return servers, nil
}
