package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/utils"
)

type User struct {
	Username string
	Avatar   string
	AvatarID string
	Bio      string
}

func CreateDefaultServerProfile(ctx context.Context, db *databases.Container, p *queue.CreateDefaultServerProfilePayload) *httputil.ErrorResponse {
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	var u User
	err = db.Postgres.QueryRow(ctx, "SELECT username,avatar_url,avatar_id, bio from users where id = $1", userID).Scan(&u.Username, &u.Avatar, &u.AvatarID, &u.Bio)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: errors.New("user not found"), Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	_, err = db.Postgres.Exec(ctx, "INSERT INTO server_profile(server_id,user_id,member_id,username,avatar,avatar_asset_id,bio) values($1,$2,$3,$4,$5,$6,$7)", p.ServerID, userID, p.MemberID, u.Username, u.Avatar, u.AvatarID, u.Bio)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
