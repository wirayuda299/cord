package users

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type DeleteUserPayload struct {
	ID string `json:"id"`
}

func DeleteUser(ctx context.Context, db *databases.Container, p *DeleteUserPayload) *httputil.ErrorResponse {
	if p.ID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user ID is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, `DELETE FROM users WHERE id = $1;`, p.ID)
	if err != nil {
		log.Println("Failed to delete user -> ", err.Error())
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
