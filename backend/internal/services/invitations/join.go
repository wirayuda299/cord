package invitations

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

func JoinServerWithInvitationCode(ctx context.Context, db *databases.Container, code string, userId string) *httputil.ErrorResponse {
	var insertedID string

	err := db.Postgres.QueryRow(ctx, `
		WITH invite AS (
			UPDATE invitations
			SET uses = uses + 1
			WHERE code = $1
			  AND uses < max_users
			RETURNING server_id
		),
		inserted AS (
			INSERT INTO members (user_id, server_id)
			SELECT $2, server_id
			FROM invite
			ON CONFLICT (server_id, user_id) DO NOTHING
			RETURNING id
		)
		SELECT id FROM inserted;
	`, code, userId).Scan(&insertedID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return &httputil.ErrorResponse{
				Err:  errors.New("Invalid code, invite full, or already joined"),
				Code: http.StatusForbidden,
			}
		}

		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
