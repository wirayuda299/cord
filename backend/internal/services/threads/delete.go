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

	// HasPermission only checked that the caller has manage_thread on
	// p.ServerID (client-supplied) — it says nothing about which server the
	// thread itself belongs to. Resolve the thread's real server through its
	// channel and require it to match, otherwise a moderator on any server
	// could delete a thread belonging to a completely different one just by
	// knowing its ID.
	var channelID, messageID, realServerID string
	err = db.Postgres.QueryRow(ctx,
		"SELECT t.channel_id::text, t.message_id::text, c.server_id::text FROM threads t JOIN channels c ON c.id = t.channel_id WHERE t.id = $1",
		p.ThreadID,
	).Scan(&channelID, &messageID, &realServerID)
	if err != nil {
		return "", "", &httputil.ErrorResponse{Err: errors.New("thread not found"), Code: http.StatusNotFound}
	}

	if realServerID != p.ServerID {
		return "", "", &httputil.ErrorResponse{Err: errors.New("no permission"), Code: http.StatusForbidden}
	}

	_, err = db.Postgres.Exec(ctx, "DELETE FROM threads WHERE id = $1", p.ThreadID)
	if err != nil {
		return "", "", &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return channelID, messageID, nil
}
