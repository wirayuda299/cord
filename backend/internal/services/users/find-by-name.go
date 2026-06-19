package users

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	AvatarURL    string    `json:"avatar_url"`
	AvatarID     string    `json:"avatar_id"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"uodated_at"`
	FriendStatus string    `json:"friend_status"`
}

func FindUsersByName(ctx context.Context, db *databases.Container, username string) ([]User, *httputil.ErrorResponse) {

	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if username == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("username is required"),
			Code: http.StatusBadRequest,
		}
	}

	users := make([]User, 0)

	rows, err := db.Postgres.Query(ctx, `
	SELECT
		u.id,
		u.username,
		COALESCE(u.avatar_url, ''),
		COALESCE(u.avatar_id, ''),
		u.created_at,
		u.updated_at,
		COALESCE(f.status, '') as friendship_status
	FROM users u
	LEFT JOIN friends f
		ON (
			(f.requester_id = $2 AND f.addressee_id = u.id)
			OR
			(f.requester_id = u.id AND f.addressee_id = $2)
		)
	WHERE similarity(u.username, $1) > 0.3
		AND u.id <> $2
	ORDER BY similarity(u.username, $1) DESC
`, username, userID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()

	for rows.Next() {
		var u User

		if err := rows.Scan(&u.ID, &u.Name, &u.AvatarURL, &u.AvatarID, &u.CreatedAt, &u.UpdatedAt, &u.FriendStatus); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		users = append(users, u)
	}

	if rows.Err() != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return users, nil
}
