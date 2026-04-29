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

func SendFriendRequest(ctx context.Context, db *databases.Container, p *SendFriendRequestPayload) *httputil.ErrorResponse {
	if p.AddresseeID == "" {
		return &httputil.ErrorResponse{Err: errors.New("addresse ID is missing"), Code: http.StatusBadRequest}
	}

	if p.RequesterID == "" {
		return &httputil.ErrorResponse{Err: errors.New("Requester ID is missing"), Code: http.StatusBadRequest}
	}

	var requesterUserExist bool
	var addresseeUserExist bool

	err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 from users where id = $1)", p.AddresseeID).Scan(&requesterUserExist)
	if err != nil {

		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 from users where id = $1)", p.AddresseeID).Scan(&addresseeUserExist)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
		}
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	_, err = db.Postgres.Exec(ctx, "INSERT INTO friends(requester_id,addressee_id) values($1,$2)", p.RequesterID, p.AddresseeID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
