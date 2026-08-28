package channels

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type UpdateChannelPayload struct {
	ChannelID  string  `json:"channel_id"`
	Name       string  `json:"name"`
	Topic      string  `json:"topic"`
	CategoryID *string `json:"category_id"`
	ServerID   string  `json:"server_id"`
}

func UpdateChannel(ctx context.Context, db *databases.Container, p *UpdateChannelPayload) *httputil.ErrorResponse {
	_, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_channel",
	})

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to update channel"), Code: http.StatusUnauthorized}
	}

	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel ID is required"), Code: http.StatusBadRequest}
	}

	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("Channel name is required"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	tag, err := db.Postgres.Exec(ctx,
		"UPDATE channels SET name = $1, topic = $2, category_id = $3 WHERE id = $4 AND server_id = $5",
		p.Name, p.Topic, p.CategoryID, p.ChannelID, p.ServerID,
	)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if tag.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("channel not found"), Code: http.StatusNotFound}
	}

	return nil
}
