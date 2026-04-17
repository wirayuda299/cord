package services

import "time"

type MessageRow struct {
	ID             string    `json:"id"`
	Content        string    `json:"content"`
	UserID         string    `json:"user_id"`
	ParentMsgID    *string   `json:"parent_msg_id"`
	Username       string    `json:"username"`
	Avatar         string    `json:"avatar"`
	ImageURL       string    `json:"image_url"`
	ImageAssetID   string    `json:"image_asset_id"`
	ChannelID      string    `json:"channel_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	ParentContent  *string   `json:"parent_content"`
	ParentUsername *string   `json:"parent_username"`
}
