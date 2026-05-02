package friends

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type FriendListItem struct {
	FriendshipID string    `json:"friendship_id"`
	UserID       string    `json:"user_id"`
	Username     string    `json:"username"`
	AvatarURL    string    `json:"avatar_url"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

func FindAllFriends(ctx context.Context, db *databases.Container, currentUserID string) ([]FriendListItem, *httputil.ErrorResponse) {
	if currentUserID == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("user ID is missing"),
			Code: http.StatusBadRequest,
		}
	}

	friends := make([]FriendListItem, 0)

	rows, err := db.Postgres.Query(ctx, `
		SELECT
			f.id AS friendship_id,

			CASE
				WHEN f.requester_id = $1 THEN au.id
				ELSE ru.id
			END AS user_id,

			CASE
				WHEN f.requester_id = $1 THEN au.username
				ELSE ru.username
			END AS username,

			COALESCE(
				CASE
					WHEN f.requester_id = $1 THEN au.avatar_url
					ELSE ru.avatar_url
				END,
				''
			) AS avatar_url,

			f.status,
			f.created_at
		FROM friends AS f
		JOIN users AS ru ON ru.id = f.requester_id
		JOIN users AS au ON au.id = f.addressee_id
		WHERE
			(f.requester_id = $1 OR f.addressee_id = $1)
			AND f.status = 'accepted'
		ORDER BY f.created_at DESC
	`, currentUserID)

	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	defer rows.Close()

	for rows.Next() {
		var friend FriendListItem

		if err := rows.Scan(
			&friend.FriendshipID,
			&friend.UserID,
			&friend.Username,
			&friend.AvatarURL,
			&friend.Status,
			&friend.CreatedAt,
		); err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}

		friends = append(friends, friend)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return friends, nil
}
