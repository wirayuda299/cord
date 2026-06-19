package queue

import "encoding/json"

type Job struct {
	Type     string          `json:"type"`
	Payload  json.RawMessage `json:"payload"`
	Attempts int             `json:"attempts"`
	MaxRetry int             `json:"max_retry"`
}

const (
	DeleteImage                = "delete_image"
	CreateChannel              = "create_channel"
	UpdateRolePermission       = "update_role_permission"
	CreateDefaultServerProfile = "create_default_server_profile"
	CreateDefaultServerSafety  = "create_default_server_safety"
	RecordAuditLogEntry        = "record_audit_log_entry"
)

type CreateChannelPayload struct {
	ServerId  string `json:"server_id"`
	CreatedBy string `json:"created_by"`
}

type AuditChange struct {
	Field  string `json:"field"`
	Before string `json:"before"`
	After  string `json:"after"`
}

type RecordAuditLogEntryPayload struct {
	ServerID   string        `json:"server_id"`
	ActorID    string        `json:"actor_id"`
	ActionType string        `json:"action_type"`
	Target     string        `json:"target"`
	Changes    []AuditChange `json:"changes"`
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

type UpdateRolePermissionPayload struct {
	Permission []string `json:"permission"`
	RoleID     string   `json:"role_id"`
}

type CreateDefaultServerProfilePayload struct {
	ServerID string `json:"server_id"`
	MemberID string `json:"member_id"`
	UserID   string `json:"user_id"`
}

type CreateDefaultServerSafetyPayload struct {
	ServerID  string `json:"server_id,omitempty"`
	CreatedBy string `json:"created_by,omitempty"`
}
