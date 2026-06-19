package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services/servers/safety"
	"github.com/wirayuda299/backend/internal/utils"
)

type ServerEvictor interface {
	EvictServer(serverId string)
}

func DeleteServer(ctx context.Context, db *databases.Container, evictor ServerEvictor, serverID string) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if serverID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	// Fetch owner, logo_id and banner_id
	var ownerID string
	var logoID string
	var bannerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by, logo_id, banner_id FROM servers WHERE id = $1", serverID).Scan(&ownerID, &logoID, &bannerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: errors.New("server not found"), Code: http.StatusNotFound}
	}

	// Only owner can delete the server
	if ownerID != userID {
		return &httputil.ErrorResponse{Err: errors.New("forbidden: only the server owner can delete the server"), Code: http.StatusForbidden}
	}

	// 2FA Security Check if required by safety setup
	s, safetyErr := safety.GetServerSafetySettings(ctx, db, serverID)
	if safetyErr == nil && s.Require2FA {
		u, err := user.Get(ctx, userID)
		if err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		if !u.TwoFactorEnabled {
			return &httputil.ErrorResponse{Err: errors.New("you must enable 2FA on your account to delete this server"), Code: http.StatusForbidden}
		}
	}

	// Queue background jobs to delete logo and banner from Cloudinary if present
	if logoID != "" {
		_ = queue.PushJob(ctx, db.Redis, queue.DeleteImage, &queue.DeleteImagePayload{
			PublicID: logoID,
		})
	}
	if bannerID != "" {
		_ = queue.PushJob(ctx, db.Redis, queue.DeleteImage, &queue.DeleteImagePayload{
			PublicID: bannerID,
		})
	}

	// Delete from servers (ON DELETE CASCADE handles all related tables)
	_, err = db.Postgres.Exec(ctx, "DELETE FROM servers WHERE id = $1", serverID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Evict all WebSocket sessions for this server
	if evictor != nil {
		evictor.EvictServer(serverID)
	}

	return nil
}
