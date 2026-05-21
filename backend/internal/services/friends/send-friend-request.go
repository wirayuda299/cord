package friends

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type SendFriendRequestPayload struct {
	RequesterID string `json:"requester_id"`
	AddresseeID string `json:"addressee_id"`
}

func isUserExist(ctx context.Context, db *databases.Container, userID string) (bool, error) {
	var userExist bool

	err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 from users where id = $1)", userID).Scan(&userExist)
	if err != nil {
		return false, err
	}

	if userExist {
		return true, nil
	} else {
		return false, nil
	}
}

func SendFriendRequest(ctx context.Context, db *databases.Container, p *SendFriendRequestPayload) *httputil.ErrorResponse {
	if p == nil {
		return &httputil.ErrorResponse{
			Err:  errors.New("payload is required"),
			Code: http.StatusBadRequest,
		}
	}

	if p.AddresseeID == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("target user ID is missing"),
			Code: http.StatusBadRequest,
		}
	}

	if p.RequesterID == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("requester ID is missing"),
			Code: http.StatusBadRequest,
		}
	}

	if p.AddresseeID == p.RequesterID {
		return &httputil.ErrorResponse{
			Err:  errors.New("you can't send friend request to yourself"),
			Code: http.StatusBadRequest,
		}
	}

	if _, err := isUserExist(ctx, db, p.AddresseeID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{
				Err:  errors.New("target user not found"),
				Code: http.StatusNotFound,
			}
		}

		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if _, err := isUserExist(ctx, db, p.RequesterID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{
				Err:  errors.New("requester user not found"),
				Code: http.StatusNotFound,
			}
		}

		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	var status string

	err := db.Postgres.QueryRow(ctx, `
		SELECT status
		FROM friends
		WHERE 
			(requester_id = $1 AND addressee_id = $2)
			OR
			(requester_id = $2 AND addressee_id = $1)
	`, p.RequesterID, p.AddresseeID).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			_, err = db.Postgres.Exec(ctx, `
				INSERT INTO friends(requester_id, addressee_id, status)
				VALUES($1, $2, 'pending')
			`, p.RequesterID, p.AddresseeID)
			if err != nil {
				return &httputil.ErrorResponse{
					Err:  err,
					Code: http.StatusInternalServerError,
				}
			}

			return nil
		}

		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	switch status {
	case "pending":
		return &httputil.ErrorResponse{
			Err:  errors.New("friend request already exists"),
			Code: http.StatusBadRequest,
		}
	case "accepted":
		return &httputil.ErrorResponse{
			Err:  errors.New("you are already friends"),
			Code: http.StatusBadRequest,
		}
	case "blocked":
		return &httputil.ErrorResponse{
			Err:  errors.New("you can't send friend request to this user"),
			Code: http.StatusBadRequest,
		}
	default:
		return &httputil.ErrorResponse{
			Err:  errors.New("invalid friendship status"),
			Code: http.StatusInternalServerError,
		}
	}
}
