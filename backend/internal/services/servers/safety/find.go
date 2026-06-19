package safety

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type SafetySetup struct {
	Level               string `json:"level"`
	Require2FA          bool   `json:"require_2_fa"`
	ContentFilter       string `json:"content_filter"`
	DefaultNotification string `json:"default_notification"`
	DmSpamFilter        bool   `json:"dm_spam_filter"`
}

func GetServerSafetySettings(ctx context.Context, db *databases.Container, server_id string) (*SafetySetup, *httputil.ErrorResponse) {
	if server_id == "" {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("server id is missing"),
			Code: http.StatusBadRequest,
		}
	}

	var s SafetySetup

	err := db.Postgres.QueryRow(ctx, `
		SELECT
		level,
		content_filter,
		default_notifications,
		dm_spam_filter,
		require2fa
		from safety_setup
		where server_id = $1`, server_id).Scan(&s.Level, &s.ContentFilter, &s.DefaultNotification, &s.DmSpamFilter, &s.Require2FA)

	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return &s, nil
}
