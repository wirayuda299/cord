package permissions

import (
	"context"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/utils"
)

type HasPermissionType struct {
	Ctx        context.Context
	Db         *databases.Container
	ServerID   string
	Permission string
}

// HasPermission checks if the user is the owner or has a role with the required permission on the server.
func HasPermission(p *HasPermissionType) (bool, error) {
	var hasPerm bool
	userID, err := utils.GetSession(p.Ctx)
	if err != nil {
		return hasPerm, err
	}
	var isBanned bool
	err = p.Db.Postgres.QueryRow(p.Ctx, "SELECT EXISTS(SELECT 1 FROM bans WHERE server_id = $1 AND user_id = $2)", p.ServerID, userID).Scan(&isBanned)
	if err == nil && isBanned {
		return false, nil
	}
	query := `
            SELECT EXISTS (
                -- Check if user is the server owner
                SELECT 1 FROM servers WHERE id = $1 AND created_by = $2
                UNION ALL
                -- Check if user has a role with the permission
                SELECT 1 FROM user_roles ur
                JOIN permissions p ON ur.role_id = p.role_id
                WHERE ur.server_id = $1 AND ur.user_id = $2 AND $3 = ANY(p.list)
            )
        `
	err = p.Db.Postgres.QueryRow(p.Ctx, query, p.ServerID, userID, p.Permission).Scan(&hasPerm)
	return hasPerm, err
}
