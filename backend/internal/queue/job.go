package queue

import "encoding/json"

type Job struct {
	Type     string          `json:"type"`
	Payload  json.RawMessage `json:"payload"`
	Attempts int             `json:"attempts"`
	MaxRetry int             `json:"max_retry"`
}

const (
	DeleteImage   = "delete_image"
	CreateChannel = "create_channel"
)

type CreateChannelPayload struct {
	ServerId  string
	CreatedBy string
}

const (
	JobsQueue       = "jobs"
	DeadLetterQueue = "jobs:dead"
)

type UploadImagePayload struct {
	FileBytes []byte `json:"file_bytes"`
	MessageID string `json:"message_id"`
	ChannelID string `json:"channel_id"` // needed to broadcast update
}

type DeleteImagePayload struct {
	ID        string `json:"id"`
	PublicID  string `json:"public_id"`
	ServerID  string `json:"server_id"`
	ChannelID string `json:"channel_id"`
}
