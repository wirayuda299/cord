package servers

import (
	"context"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type ServerResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Logo string `json:"logo"`
}

func GetAllServersByUserID(ctx context.Context, db *databases.Container) ([]ServerResponse, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	rows, err := db.Postgres.Query(ctx, `select id, name, COALESCE(logo, '') as logo from servers where created_by = $1`, userID)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	defer rows.Close()
	servers := make([]ServerResponse, 0)

	for rows.Next() {
		var server ServerResponse
		if err := rows.Scan(&server.ID, &server.Name, &server.Logo); err != nil {
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
