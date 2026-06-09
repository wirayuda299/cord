package categories

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/permissions"
	"github.com/wirayuda299/backend/internal/utils"
)

type CreateCategoryPayload struct {
	Name     string `json:"name"`
	ServerID string `json:"server_id"`
}

func CreateCategory(ctx context.Context, db *databases.Container, p *CreateCategoryPayload) *httputil.ErrorResponse {
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
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to create category"), Code: http.StatusUnauthorized}
	}
	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("name is required"), Code: http.StatusBadRequest}
	}
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}

	_, err = db.Postgres.Exec(ctx,
		"INSERT INTO categories(name, server_id, created_by) VALUES($1, $2, $3)",
		p.Name, p.ServerID, userID,
	)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
