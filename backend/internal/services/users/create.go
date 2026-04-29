package users

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateUserPayload struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
	AvatarID  string `json:"avatar_id"`
	Bio       string `json:"bio"`
}

func CreateUser(ctx context.Context, db *databases.Container, p *CreateUserPayload) *httputil.ErrorResponse {
	if p.ID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user ID is missing"), Code: http.StatusBadRequest}
	}

	if p.Username == "" {
		return &httputil.ErrorResponse{Err: errors.New("username is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, "INSERT INTO users(id,username,avatar_url,avatar_id,bio) values($1,$2,$3,$4,$5)", p.ID, p.Username, p.AvatarURL, p.AvatarID, p.Bio)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
