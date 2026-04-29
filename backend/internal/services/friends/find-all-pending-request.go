package friends

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Friend struct {
	ID                 string    `json:"id"`
	Status             string    `json:"status"`
	RequesterUserID    string    `json:"requester_user_id"`
	RequesterUsername  string    `json:"requester_username"`
	RequesterAvatarURL string    `json:"requester_avatar_url"`
	AddresseeUserID    string    `json:"addressee_user_id"`
	AddresseeUsername  string    `json:"addressee_username"`
	AddresseeAvatarURL string    `json:"addressee_avatar_url"`
	CreatedAt          time.Time `json:"created_at"`
}

func GetAllPendingInvitations(ctx context.Context, db *databases.Container, userID string) ([]Friend, *httputil.ErrorResponse) {

	if userID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("user id is missing"), Code: http.StatusBadRequest}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT
		f.id,
		f.status,
		ru.id as requester_user_id,
		ru.username as requester_username,
		COALESCE(ru.avatar_url, '') as requester_avatar_url,
		au.id as addressee_user_id,
		au.username as addressee_username,
		COALESCE(au.avatar_url, '') as addressee_avatar_url,
		f.created_at
		from friends as f
		left join users as ru on ru.id =requester_id
		left join users as au on au.id = addressee_id
		where requester_id = $1 or addressee_id = $1`, userID)

	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}

	}
	defer rows.Close()

	var invitations []Friend

	for rows.Next() {
		var i Friend
		if err = rows.Scan(&i.ID, &i.Status, &i.RequesterUserID, &i.RequesterUsername, &i.RequesterAvatarURL, &i.AddresseeUserID, &i.AddresseeUsername, &i.AddresseeAvatarURL, &i.CreatedAt); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		invitations = append(invitations, i)
	}

	if rows.Err() != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return invitations, nil

}
