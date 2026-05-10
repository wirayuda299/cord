package conversations

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type ConversationDetail struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	ChannelType    string `json:"channel_type"`
	ServerID       string `json:"server_id"`
	Topic          string `json:"topic"`
	OtherUserID    string `json:"other_user_id"`
	OtherUsername  string `json:"other_username"`
	OtherAvatarURL string `json:"other_avatar_url"`
}

func FindConversationByID(ctx context.Context, db *databases.Container, channelID, currentUserID string) (*ConversationDetail, *httputil.ErrorResponse) {
	if channelID == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("conversation id is required"),
			Code: http.StatusBadRequest,
		}
	}

	if currentUserID == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("user id is required"),
			Code: http.StatusBadRequest,
		}
	}

	var c ConversationDetail
	err := db.Postgres.QueryRow(ctx, `
		SELECT
			ch.id::text,
			COALESCE(ch.name, other_user.username, 'Direct Message') AS name,
			ch.channel_type::text,
			COALESCE(ch.server_id::text, '') AS server_id,
			COALESCE(ch.topic, '') AS topic,
			COALESCE(other_user.id, '') AS other_user_id,
			COALESCE(other_user.username, '') AS other_username,
			COALESCE(other_user.avatar_url, '') AS other_avatar_url
		FROM channels AS ch
		LEFT JOIN LATERAL (
			SELECT u.id, u.username, u.avatar_url
			FROM channel_members AS cm2
			JOIN users AS u ON u.id = cm2.user_id
			WHERE cm2.channel_id = ch.id
				AND cm2.user_id <> $2
			ORDER BY u.username
			LIMIT 1
		) AS other_user ON true
		WHERE ch.id = $1
			AND ch.server_id IS NULL
			AND ch.channel_type IN ('dm', 'group_dm')
			AND EXISTS (
				SELECT 1
				FROM channel_members AS cm
				WHERE cm.channel_id = ch.id
					AND cm.user_id = $2
			)
	`, channelID, currentUserID).Scan(
		&c.ID,
		&c.Name,
		&c.ChannelType,
		&c.ServerID,
		&c.Topic,
		&c.OtherUserID,
		&c.OtherUsername,
		&c.OtherAvatarURL,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{
				Err:  errors.New("conversation not found"),
				Code: http.StatusNotFound,
			}
		}
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return &c, nil
}
