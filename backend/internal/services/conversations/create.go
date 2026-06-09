package conversations

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type CreateConversationPayload struct {
	TargetedUserID string `json:"targeted_user_id"`
}

type CreateConversationResult struct {
	ChannelID string `json:"channel_id"`
}

func makeDMKey(userA, userB string) string {
	if userA < userB {
		return userA + ":" + userB
	}

	return userB + ":" + userA
}

func CreateConversation(
	ctx context.Context,
	db *databases.Container,
	p CreateConversationPayload,
) (*CreateConversationResult, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	if p.TargetedUserID == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("targeted user id is required"),
			Code: http.StatusBadRequest,
		}
	}

	if userID == p.TargetedUserID {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("cannot create DM with yourself"),
			Code: http.StatusBadRequest,
		}
	}

	dmKey := makeDMKey(userID, p.TargetedUserID)

	tx, beginErr := db.Postgres.Begin(ctx)

	if beginErr != nil {
		return nil, &httputil.ErrorResponse{
			Err:  beginErr,
			Code: http.StatusInternalServerError,
		}
	}

	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtext($1))", dmKey); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	var channelID string

	err = tx.QueryRow(ctx, `
		SELECT id::text
		FROM channels
		WHERE server_id IS NULL
			AND channel_type = 'dm'
			AND dm_key = $1
		ORDER BY created_at ASC
		LIMIT 1
	`, dmKey).Scan(&channelID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if errors.Is(err, pgx.ErrNoRows) {
		err = tx.QueryRow(ctx, `
			INSERT INTO channels (
				name,
				channel_type,
				server_id,
				dm_key,
				created_by
			)
			VALUES (
				NULL,
				'dm',
				NULL,
				$2,
				$1
			)
			RETURNING id
		`, userID, dmKey).Scan(&channelID)
		if err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO channel_members (channel_id, user_id)
		VALUES ($1, $2), ($1, $3)
		ON CONFLICT (channel_id, user_id) DO NOTHING
	`, channelID, userID, p.TargetedUserID); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return &CreateConversationResult{
		ChannelID: channelID,
	}, nil
}
