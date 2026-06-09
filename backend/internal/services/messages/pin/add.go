package pin

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type PinMessagePayload struct {
	MessageID string `json:"msg_id"`
	ChannelID string `json:"channel_id"`
	ServerID  string `json:"server_id"`
}

func PinMessage(ctx context.Context, db *databases.Container, p *PinMessagePayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_message",
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to create channel"), Code: http.StatusUnauthorized}
	}

	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel ID is missing"), Code: http.StatusBadRequest}
	}

	if p.MessageID == "" {
		return &httputil.ErrorResponse{Err: errors.New("message ID is missing"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	allowed, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_messages",
	})

	if !allowed {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to pin message"), Code: http.StatusUnauthorized}
	}
	if err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	if _, err := db.Postgres.Exec(ctx, "INSERT INTO pinned_messages(message_id, channel_id,pinned_by) values($1,$2,$3)", p.MessageID, p.ChannelID, userID); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return nil
}
