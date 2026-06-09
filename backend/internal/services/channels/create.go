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

type CreateChannelPayload struct {
	Name       string  `json:"name"`
	Type       string  `json:"type"`
	CategoryID *string `json:"category_id"`
	ServerID   string  `json:"server_id"`
}

func CreateChannel(ctx context.Context, db *databases.Container, p *CreateChannelPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
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
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to create channel"), Code: http.StatusUnauthorized}
	}

	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("Channel name is required"), Code: http.StatusBadRequest}
	}

	if p.Type == "" {
		return &httputil.ErrorResponse{Err: errors.New("channel type is required"), Code: http.StatusBadRequest}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	if _, err := db.Postgres.Exec(ctx, "INSERT INTO channels(name,channel_type,created_by,category_id,server_id) values($1,$2,$3,$4,$5)", p.Name, p.Type, userID, p.CategoryID, p.ServerID); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
