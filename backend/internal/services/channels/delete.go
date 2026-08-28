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

type DeleteChannelPayload struct {
	ChannelID string `json:"channel_id"`
	ServerID  string `json:"server_id"`
}

func DeleteChannel(ctx context.Context, db *databases.Container, p *DeleteChannelPayload) *httputil.ErrorResponse {
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
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete channel"), Code: http.StatusUnauthorized}
	}

	if p.ChannelID == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel ID is required"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	tag, err := db.Postgres.Exec(ctx, "DELETE FROM channels WHERE id = $1 AND server_id = $2", p.ChannelID, p.ServerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if tag.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("channel not found"), Code: http.StatusNotFound}
	}

	return nil
}
