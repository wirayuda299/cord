package messages

import (
	"context"
	"fmt"
	"log"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/services"
)

type Message struct {
	Message         string  `json:"message"`
	AttachmentURL   string  `json:"attachment_url"`
	AttachmentID    string  `json:"attachment_id"`
	UserID          string  `json:"user_id"`
	ParentMessageID *string `json:"parent_message_id"`
	ThreadID        *string `json:"thread_id"`
}

func Send(ctx context.Context, m Message, db *databases.Container, channelID string) (*services.MessageRow, error) {
	var row services.MessageRow

	var parentMsgID *string
	var threadID *string
	var channelIDOut *string

	var channelIDArg any = channelID
	var threadIDArg any = nil

	if m.ThreadID != nil && *m.ThreadID != "" {
		// Thread message: masuk ke thread, jadi channel_id harus NULL.
		channelIDArg = nil
		threadIDArg = *m.ThreadID
	} else {
		// Channel message: masuk ke channel, jadi thread_id harus NULL.
		threadIDArg = nil
	}

	err := db.Postgres.QueryRow(ctx, `
		INSERT INTO messages (
			content,
			user_id,
			image_url,
			image_asset_id,
			channel_id,
			parent_msg_id,
			thread_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING
			id,
			content,
			user_id,
			image_url,
			image_asset_id,
			channel_id,
			created_at,
			updated_at,
			parent_msg_id,
			thread_id
	`,
		m.Message,
		m.UserID,
		m.AttachmentURL,
		m.AttachmentID,
		channelIDArg,
		m.ParentMessageID,
		threadIDArg,
	).Scan(
		&row.ID,
		&row.Content,
		&row.UserID,
		&row.ImageURL,
		&row.ImageAssetID,
		&channelIDOut,
		&row.CreatedAt,
		&row.UpdatedAt,
		&parentMsgID,
		&threadID,
	)
	if err != nil {
		log.Println("Error send message -> ", err.Error())
		return nil, fmt.Errorf("error inserting message: %w", err)
	}

	row.ChannelID = channelIDOut
	row.ParentMsgID = parentMsgID
	row.ThreadID = threadID
	row.Threads = make([]services.ThreadRow, 0)
	row.Reactions = make([]services.ReactionRow, 0)

	err = db.Postgres.QueryRow(
		ctx,
		`SELECT username, COALESCE(avatar_url, '') FROM users WHERE id = $1`,
		m.UserID,
	).Scan(&row.Username, &row.Avatar)
	if err != nil {
		return nil, fmt.Errorf("error fetching user: %w", err)
	}

	if parentMsgID != nil {
		err = db.Postgres.QueryRow(ctx, `
			SELECT m.content, u.username
			FROM messages AS m
			LEFT JOIN users AS u ON m.user_id = u.id
			WHERE m.id = $1
		`, parentMsgID).Scan(&row.ParentContent, &row.ParentUsername)
		if err != nil {
			return nil, fmt.Errorf("failed to get parent message %w", err)
		}
	}

	return &row, nil
}
