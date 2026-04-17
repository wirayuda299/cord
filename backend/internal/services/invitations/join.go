package invitations

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

func JoinServerWithInvitationCode(ctx context.Context, db *databases.Container, code string, userId string) *httputil.ErrorResponse {
	var memberID, serverID string

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer tx.Rollback(ctx)

	err = tx.QueryRow(ctx, `
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
			RETURNING id, server_id
		)
		SELECT id, server_id FROM inserted;
	`, code, userId).Scan(&memberID, &serverID)
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

	if err := queue.PushJob(ctx, db.Redis, queue.CreateDefaultServerProfile, &queue.CreateDefaultServerProfilePayload{
		ServerID: serverID,
		UserID:   userId,
		MemberID: memberID,
	}); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
