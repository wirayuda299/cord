package categories

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Category struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	CreatedBy  string `json:"created_by"`
	ServerID   string `json:"server_id"`
	ServerName string `json:"server_name"`
}

func FindAllCategories(ctx context.Context, db *databases.Container, serverID string) ([]Category, *httputil.ErrorResponse) {
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	categories := make([]Category, 0)

	rows, err := db.Postgres.Query(ctx, `
	SELECT c.id, c.name, c.server_id, c.created_by, s.name
	FROM category as c
	JOIN servers as s ON c.server_id = s.id
	WHERE c.server_id = $1
`, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()

	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.ServerID, &c.CreatedBy, &c.ServerName); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		categories = append(categories, c)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return categories, nil
}
