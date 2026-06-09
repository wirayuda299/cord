package pin

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
)

type DeletePinMessagePayload struct {
	MessageID string `json:"msg_id"`
	ServerID  string `json:"server_id"`
}

func DeletePinMessage(ctx context.Context, db *databases.Container, p DeletePinMessagePayload) *httputil.ErrorResponse {

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
	if p.MessageID == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("message ID is missing"),
			Code: http.StatusBadRequest,
		}
	}
	var exists bool
	if err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from pinned_messages where message_id = $1)", p.MessageID).Scan(&exists); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	if !exists {
		return &httputil.ErrorResponse{
			Err:  errors.New("message doesn't exists"),
			Code: http.StatusNotFound,
		}
	}
	if _, err := db.Postgres.Exec(ctx, "DELETE FROM pinned_messages where message_id = $1", p.MessageID); err != nil {
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
