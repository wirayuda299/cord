package threads

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
)

type DeleteThreadRequest struct {
	ThreadID  string `json:"thread_id,omitempty"`
	ServerID  string `json:"server_id,omitempty"`
	ChannelID string `json:"channel_id,omitempty"`
}

func DeleteThread(ctx context.Context, db *databases.Container, p DeleteThreadRequest) (string, string, *httputil.ErrorResponse) {

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_thread",
	})

	if err != nil {
		return "", "", &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !hasPerm {
		return "", "", &httputil.ErrorResponse{Err: errors.New("no permission"), Code: http.StatusForbidden}
	}

	var channelID, messageID string
	err = db.Postgres.QueryRow(ctx, "SELECT channel_id::text, message_id::text FROM threads WHERE id = $1", p.ThreadID).Scan(&channelID, &messageID)
	if err != nil {
		return "", "", &httputil.ErrorResponse{Err: errors.New("thread not found"), Code: http.StatusNotFound}
	}

	_, err = db.Postgres.Exec(ctx, "DELETE FROM threads WHERE id = $1", p.ThreadID)
	if err != nil {
		return "", "", &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return channelID, messageID, nil
}
