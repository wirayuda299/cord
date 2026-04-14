package categories

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Category struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	CreatedBy  string `json:"created_by"`
	ServerId   string `json:"server_id"`
	ServerName string `json:"server_name"`
}

func FindAllCategories(ctx context.Context, db *databases.Container, serverId string) ([]Category, *httputil.ErrorResponse) {
	if serverId == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}
	var categories []Category

	rows, err := db.Postgres.Query(ctx, `
	SELECT c.id, c.name, c.server_id, c.created_by, s.name
	FROM category as c
	JOIN servers as s ON c.server_id = s.id
	WHERE c.server_id = $1
`, serverId)
	if err != nil {
		log.Println(err.Error())
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.Id, &c.Name, &c.ServerId, &c.CreatedBy, &c.ServerName); err != nil {
			log.Println(err.Error())
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		categories = append(categories, c)
	}
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	log.Println(categories)

	return categories, nil
}
