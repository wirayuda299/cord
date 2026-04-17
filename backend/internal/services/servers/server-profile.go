package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type User struct {
	Username string
	Avatar   string
	AvatarID string
	Bio      string
}

func CreateDefaultServerProfile(ctx context.Context, db *databases.Container, p *queue.CreateDefaultServerProfilePayload) *httputil.ErrorResponse {
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}
	if p.UserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("User ID is missing"), Code: http.StatusBadRequest}
	}

	var u User
	err := db.Postgres.QueryRow(ctx, "SELECT username,avatar_url,avatar_id, bio from users where id = $1", p.UserID).Scan(&u.Username, &u.Avatar, &u.AvatarID, &u.Bio)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("User not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	_, err = db.Postgres.Exec(ctx, "INSERT INTO server_profile(server_id,user_id,member_id,username,avatar,avatar_asset_id,bio) values($1,$2,$3,$4,$5,$6,$7)", p.ServerID, p.UserID, p.MemberID, u.Username, u.Avatar, u.AvatarID, u.Bio)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
