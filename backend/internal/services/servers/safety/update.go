package safety

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/services/servers/audit"
	"github.com/wirayuda299/backend/internal/utils"
)

type UpdateSafetyPayload struct {
	ServerID            string `json:"server_id"`
	Level               string `json:"verification_level"`
	Require2FA          bool   `json:"require_2_fa"`
	ContentFilter       string `json:"content_filter"`
	DefaultNotification string `json:"default_notification"`
	DmSpamFilter        bool   `json:"dm_spam_filter"`
}

func UpdateServerSafetySettings(ctx context.Context, db *databases.Container, p *UpdateSafetyPayload) *httputil.ErrorResponse {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	// Verify the caller is the server owner or has manage_server permission
	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_server",
	})
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to make this changes"), Code: http.StatusForbidden}
	}

	// Get current settings
	var before SafetySetup
	beforeErr := db.Postgres.QueryRow(ctx, "SELECT level, content_filter, default_notifications, dm_spam_filter, require2fa FROM safety_setup WHERE server_id = $1", p.ServerID).Scan(
		&before.Level, &before.ContentFilter, &before.DefaultNotification, &before.DmSpamFilter, &before.Require2FA,
	)

	// Update query
	query := `
		INSERT INTO safety_setup (server_id, level, content_filter, default_notifications, dm_spam_filter, require2fa, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (server_id) DO UPDATE SET
			level = EXCLUDED.level,
			content_filter = EXCLUDED.content_filter,
			default_notifications = EXCLUDED.default_notifications,
			dm_spam_filter = EXCLUDED.dm_spam_filter,
			require2fa = EXCLUDED.require2fa,
			updated_at = NOW()
	`

	_, err = db.Postgres.Exec(ctx, query, p.ServerID, p.Level, p.ContentFilter, p.DefaultNotification, p.DmSpamFilter, p.Require2FA, userID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Record audit entry
	var changes []audit.AuditChange
	if beforeErr == nil {
		if before.Level != p.Level {
			changes = append(changes, audit.AuditChange{Field: "verification_level", Before: before.Level, After: p.Level})
		}
		if before.Require2FA != p.Require2FA {
			changes = append(changes, audit.AuditChange{Field: "require_2_fa", Before: strconv.FormatBool(before.Require2FA), After: strconv.FormatBool(p.Require2FA)})
		}
		if before.ContentFilter != p.ContentFilter {
			changes = append(changes, audit.AuditChange{Field: "content_filter", Before: before.ContentFilter, After: p.ContentFilter})
		}
		if before.DefaultNotification != p.DefaultNotification {
			changes = append(changes, audit.AuditChange{Field: "default_notification", Before: before.DefaultNotification, After: p.DefaultNotification})
		}
		if before.DmSpamFilter != p.DmSpamFilter {
			changes = append(changes, audit.AuditChange{Field: "dm_spam_filter", Before: strconv.FormatBool(before.DmSpamFilter), After: strconv.FormatBool(p.DmSpamFilter)})
		}
	} else {
		changes = append(changes, audit.AuditChange{Field: "safety_setup", After: "initialized"})
	}
	_ = audit.EnqueueAuditEntry(ctx, db.Redis, p.ServerID, userID, "safety_setup_updated", "Server Safety Settings", changes)

	return nil
}
