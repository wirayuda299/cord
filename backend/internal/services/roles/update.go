package roles

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type UpdatePayload struct {
	RoleID        string   `json:"role_id"`
	ServerID      string   `json:"server_id"`
	Name          *string  `json:"name,omitempty"`
	Color         *string  `json:"color,omitempty"`
	Icon          *string  `json:"icon,omitempty"`
	Hoist         *bool    `json:"hoist,omitempty"`
	Mentionable   *bool    `json:"mentionable,omitempty"`
	PermissionIDs []string `json:"permission_ids,omitempty"`
}

func UpdateRole(ctx context.Context, db *databases.Container, p UpdatePayload) *httputil.ErrorResponse {
	_, err := utils.GetSession(ctx)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	hasPerm, err := permissions.HasPermission(&permissions.HasPermissionType{
		Ctx:        ctx,
		Db:         db,
		ServerID:   p.ServerID,
		Permission: "manage_role",
	})

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if !hasPerm {
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to update role"), Code: http.StatusUnauthorized}
	}

	if p.RoleID == "" {
		return &httputil.ErrorResponse{Err: errors.New("role ID is required"), Code: http.StatusBadRequest}
	}

	// HasPermission only proves the caller manages *a* role on p.ServerID —
	// without this, they could pass a role_id belonging to a different
	// server and mutate (or push permission changes to) a role they have no
	// authority over.
	var roleBelongsToServer bool
	if err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1 AND server_id = $2)", p.RoleID, p.ServerID).Scan(&roleBelongsToServer); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if !roleBelongsToServer {
		return &httputil.ErrorResponse{Err: errors.New("role not found"), Code: http.StatusNotFound}
	}

	setClauses := []string{}
	var args []any
	idx := 1

	if p.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", idx))
		args = append(args, *p.Name)
		idx++
	}
	if p.Color != nil {
		setClauses = append(setClauses, fmt.Sprintf("color = $%d", idx))
		args = append(args, *p.Color)
		idx++
	}
	if p.Icon != nil {
		setClauses = append(setClauses, fmt.Sprintf("icon = $%d", idx))
		args = append(args, *p.Icon)
		idx++
	}
	if p.Hoist != nil {
		setClauses = append(setClauses, fmt.Sprintf("hoist = $%d", idx))
		args = append(args, *p.Hoist)
		idx++
	}
	if p.Mentionable != nil {
		setClauses = append(setClauses, fmt.Sprintf("mentionable = $%d", idx))
		args = append(args, *p.Mentionable)
		idx++
	}

	if len(setClauses) > 0 {
		args = append(args, p.RoleID)
		query := fmt.Sprintf(
			"UPDATE roles SET %s WHERE id = $%d",
			strings.Join(setClauses, ", "),
			idx,
		)
		if _, err := db.Postgres.Exec(ctx, query, args...); err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
	}

	if len(p.PermissionIDs) > 0 {
		if err := queue.PushJob(ctx, db.Jobs, queue.UpdateRolePermission, queue.UpdateRolePermissionPayload{
			Permission: p.PermissionIDs,
			RoleID:     p.RoleID,
		}); err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
	}

	return nil
}
