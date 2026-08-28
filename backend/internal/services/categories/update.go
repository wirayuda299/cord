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

type UpdateCategoryPayload struct {
	CategoryID string `json:"category_id"`
	ServerID   string `json:"server_id"`
	Name       string `json:"name"`
}

func UpdateCategory(ctx context.Context, db *databases.Container, p *UpdateCategoryPayload) *httputil.ErrorResponse {
	_, err := utils.GetSession(ctx)
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
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to update category"), Code: http.StatusUnauthorized}
	}
	if p.CategoryID == "" {
		return &httputil.ErrorResponse{Err: errors.New("category_id is required"), Code: http.StatusBadRequest}
	}
	if p.Name == "" {
		return &httputil.ErrorResponse{Err: errors.New("name is required"), Code: http.StatusBadRequest}
	}
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}

	tag, err := db.Postgres.Exec(ctx,
		"UPDATE categories SET name = $1 WHERE id = $2 AND server_id = $3",
		p.Name, p.CategoryID, p.ServerID,
	)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if tag.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("category not found"), Code: http.StatusNotFound}
	}

	return nil
}
