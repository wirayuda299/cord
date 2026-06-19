package audit

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type AuditChange struct {
	Field  string `json:"field"`
	Before string `json:"before"`
	After  string `json:"after"`
}

type AuditLogEntry struct {
	ID         string        `json:"id"`
	ServerID   string        `json:"server_id"`
	ActorID    string        `json:"actor_id"`
	ActorName  string        `json:"actor_name"`
	ActionType string        `json:"action_type"`
	Target     string        `json:"target"`
	Changes    []AuditChange `json:"changes"`
	CreatedAt  time.Time     `json:"created_at"`
}

func RecordAuditEntry(ctx context.Context, db *databases.Container, serverID, actorID, actionType, target string, changes []AuditChange) error {
	if serverID == "" || actorID == "" || actionType == "" {
		return errors.New("missing required fields for audit log")
	}

	changesJSON, err := json.Marshal(changes)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO audit_logs (server_id, actor_id, action_type, target, changes)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = db.Postgres.Exec(ctx, query, serverID, actorID, actionType, target, changesJSON)
	return err
}

func EnqueueAuditEntry(ctx context.Context, redisClient *redis.Client, serverID, actorID, actionType, target string, changes []AuditChange) error {
	if serverID == "" || actorID == "" || actionType == "" {
		return errors.New("missing required fields for audit log")
	}

	convertedChanges := make([]queue.AuditChange, 0, len(changes))
	for _, change := range changes {
		convertedChanges = append(convertedChanges, queue.AuditChange{
			Field:  change.Field,
			Before: change.Before,
			After:  change.After,
		})
	}

	return queue.PushJob(ctx, redisClient, queue.RecordAuditLogEntry, queue.RecordAuditLogEntryPayload{
		ServerID:   serverID,
		ActorID:    actorID,
		ActionType: actionType,
		Target:     target,
		Changes:    convertedChanges,
	})
}

func FindAuditLogs(ctx context.Context, db *databases.Container, serverID string) ([]AuditLogEntry, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	// Verify permission to view audit log
	var ownerID string
	err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", serverID).Scan(&ownerID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
	}

	if userID != ownerID {
		hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
			Ctx:        ctx,
			Db:         db,
			ServerID:   serverID,
			Permission: "view_audit_log",
		})
		if err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		if !hasPerm {
			// Check if they have manage_server permission as a fallback
			hasManagePerm, err := permissions.HasPermission(&permissions.HasPermissionType{
				Ctx:        ctx,
				Db:         db,
				ServerID:   serverID,
				Permission: "manage_server",
			})
			if err != nil || !hasManagePerm {
				return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you do not have permission to view audit logs"), Code: http.StatusForbidden}
			}
		}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT 
			a.id, 
			a.server_id, 
			a.actor_id, 
			u.username AS actor_name, 
			a.action_type, 
			a.target, 
			a.changes, 
			a.created_at
		FROM audit_logs a
		JOIN users u ON a.actor_id = u.id
		WHERE a.server_id = $1
		ORDER BY a.created_at DESC
	`, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	var result []AuditLogEntry = make([]AuditLogEntry, 0)
	for rows.Next() {
		var entry AuditLogEntry
		var changesRaw []byte
		err = rows.Scan(
			&entry.ID,
			&entry.ServerID,
			&entry.ActorID,
			&entry.ActorName,
			&entry.ActionType,
			&entry.Target,
			&changesRaw,
			&entry.CreatedAt,
		)
		if err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		entry.Changes = make([]AuditChange, 0)
		if len(changesRaw) > 0 {
			_ = json.Unmarshal(changesRaw, &entry.Changes)
		}

		result = append(result, entry)
	}

	return result, nil
}
