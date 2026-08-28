package invitations

import (
	"context"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/utils"
)

func JoinServerWithInvitationCode(ctx context.Context, db *databases.Container, code string) *httputil.ErrorResponse {

	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}
	var memberID, serverID string

	tx, err := db.Postgres.Begin(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer func() {
		if err := tx.Rollback(ctx); err != nil {
			log.Println(err)
		}
	}()

	err = tx.QueryRow(ctx, `
		WITH invite AS (
			SELECT server_id FROM invitations
			WHERE code = $1 AND uses < max_users
			FOR UPDATE
		),
		inserted AS (
			INSERT INTO members (user_id, server_id)
			SELECT $2, server_id
			FROM invite
			ON CONFLICT (server_id, user_id) DO NOTHING
			RETURNING id, server_id
		),
		updated AS (
			UPDATE invitations
			SET uses = uses + 1
			WHERE code = $1 AND EXISTS (SELECT 1 FROM inserted)
			RETURNING 1
		)
		SELECT id, server_id FROM inserted;
	`, code, userID).Scan(&memberID, &serverID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &httputil.ErrorResponse{
				Err:  errors.New("invalid code, invite full, or already joined"),
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
		MemberID: memberID,
		UserID:   userID,
	}); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return nil
}
