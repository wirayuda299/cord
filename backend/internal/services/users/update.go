package users

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type UpdateUserPayload struct {
	ID            string `json:"id"`
	Username      string `json:"username"`
	AvatarURL     string `json:"avatar_url"`
	AvatarID      string `json:"avatar_id"`
	Bio           string `json:"bio"`
	EmailVerified string `json:"email_verified"`
}

func UpdateUser(ctx context.Context, db *databases.Container, p *UpdateUserPayload) *httputil.ErrorResponse {
	if p.ID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user ID is missing"), Code: http.StatusBadRequest}
	}

	if p.Username == "" {
		return &httputil.ErrorResponse{Err: errors.New("username is missing"), Code: http.StatusBadRequest}
	}

	_, err := db.Postgres.Exec(ctx, `UPDATE users SET username = $2, avatar_url = $3, avatar_id = $4, bio = $5, email_verified = $6, updated_at = NOW() WHERE id = $1;`,
		p.ID, p.Username, p.AvatarURL, p.AvatarID, p.Bio, p.EmailVerified)
	if err != nil {
		log.Println("Failed to update user -> ", err.Error())
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
