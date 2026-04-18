package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type ServerProfileData struct {
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	AvatarID string `json:"avatar_id"`
	Bio      string `json:"bio"`
}

func GetServerProfile(ctx context.Context, db *databases.Container, serverID, userID string) (*ServerProfileData, *httputil.ErrorResponse) {
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}
	if userID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("user_id is required"), Code: http.StatusBadRequest}
	}

	var p ServerProfileData
	err := db.Postgres.QueryRow(ctx, `
		SELECT username, COALESCE(avatar, '') as avatar, COALESCE(avatar_asset_id, '') as avatar_id, COALESCE(bio, '') as bio
		FROM server_profile
		WHERE server_id = $1 AND user_id = $2
	`, serverID, userID).Scan(&p.Username, &p.Avatar, &p.AvatarID, &p.Bio)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: errors.New("profile not found"), Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return &p, nil
}
