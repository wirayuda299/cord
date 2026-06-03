package conversations

import (
	"context"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type ConversationListItem struct {
	ChannelID          string    `json:"channel_id"`
	ChannelType        string    `json:"channel_type"`
	Name               string    `json:"name"`
	OtherUserID        string    `json:"other_user_id"`
	OtherUsername      string    `json:"other_username"`
	OtherAvatarURL     string    `json:"other_avatar_url"`
	LastMessageContent string    `json:"last_message_content"`
	LastMessageAt      time.Time `json:"last_message_at"`
}

func FindAllConversations(ctx context.Context, db *databases.Container) ([]ConversationListItem, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}
	rows, err := db.Postgres.Query(ctx, `
		SELECT
			c.id::text,
			c.channel_type::text,
			COALESCE(c.name, other_user.username, 'Direct Message') AS name,
			COALESCE(other_user.id, '') AS other_user_id,
			COALESCE(other_user.username, '') AS other_username,
			COALESCE(other_user.avatar_url, '') AS other_avatar_url,
			COALESCE(last_msg.content, '') AS last_message_content,
			COALESCE(last_msg.created_at, c.created_at) AS last_message_at
		FROM channel_members AS cm
		JOIN channels AS c ON c.id = cm.channel_id
		LEFT JOIN LATERAL (
			SELECT u.id, u.username, u.avatar_url
			FROM channel_members AS cm2
			JOIN users AS u ON u.id = cm2.user_id
			WHERE cm2.channel_id = c.id
				AND cm2.user_id <> $1
			ORDER BY u.username
			LIMIT 1
		) AS other_user ON true
		LEFT JOIN LATERAL (
			SELECT content, created_at
			FROM messages
			WHERE channel_id = c.id
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_msg ON true
		WHERE cm.user_id = $1
			AND c.server_id IS NULL
			AND c.channel_type IN ('dm', 'group_dm')
		ORDER BY COALESCE(last_msg.created_at, c.created_at) DESC
	`, userID)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	defer rows.Close()

	conversations := make([]ConversationListItem, 0)
	for rows.Next() {
		var c ConversationListItem
		if err := rows.Scan(
			&c.ChannelID,
			&c.ChannelType,
			&c.Name,
			&c.OtherUserID,
			&c.OtherUsername,
			&c.OtherAvatarURL,
			&c.LastMessageContent,
			&c.LastMessageAt,
		); err != nil {
			return nil, &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
		conversations = append(conversations, c)
	}

	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return conversations, nil
}
