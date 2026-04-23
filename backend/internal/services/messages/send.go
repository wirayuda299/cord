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
	ParentMessageId *string `json:"parent_message_id"`
}

func Send(ctx context.Context, m Message, db *databases.Container, channelID string) (*services.MessageRow, error) {
	var row services.MessageRow

	log.Println("Payload -> ", row)
	var parentMsgID *string
	err := db.Postgres.QueryRow(ctx, `
        INSERT INTO messages (content, user_id, image_url, image_asset_id, channel_id, parent_msg_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            content,
            user_id,
            image_url,
            image_asset_id,
            channel_id,
            created_at,
            updated_at,
            parent_msg_id
    `,
		m.Message,
		m.UserID,
		m.AttachmentURL,
		m.AttachmentID,
		channelID,
		m.ParentMessageId,
	).Scan(
		&row.ID,
		&row.Content,
		&row.UserID,
		&row.ImageURL,
		&row.ImageAssetID,
		&row.ChannelID,
		&row.CreatedAt,
		&row.UpdatedAt,
		&parentMsgID,
	)
	if err != nil {
		log.Println("Error send message -> ", err.Error())
		return nil, fmt.Errorf("error inserting message: %w", err)
	}
	row.ParentMsgID = parentMsgID
	err = db.Postgres.QueryRow(ctx, "SELECT username, avatar_url FROM users WHERE id = $1", m.UserID).Scan(&row.Username, &row.Avatar)
	if err != nil {
		return nil, fmt.Errorf("error fetching user: %w", err)
	}
	if parentMsgID != nil {
		err = db.Postgres.QueryRow(ctx, "SELECT m.content, u.username from messages as m left join users as u on m.user_id = u.id where m.id=$1", parentMsgID).Scan(&row.ParentContent, &row.ParentUsername)
		if err != nil {
			return nil, fmt.Errorf("Failed to get parent message %w", err)
		}
	}
	return &row, nil
}
