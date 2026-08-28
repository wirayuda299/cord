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

type DeleteCategoryPayload struct {
	CategoryID string `json:"category_id"`
	ServerID   string `json:"server_id"`
}

func DeleteCategory(ctx context.Context, db *databases.Container, p *DeleteCategoryPayload) *httputil.ErrorResponse {
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
		return &httputil.ErrorResponse{Err: errors.New("you not allowed to delete category"), Code: http.StatusUnauthorized}
	}
	if p.CategoryID == "" {
		return &httputil.ErrorResponse{Err: errors.New("category_id is required"), Code: http.StatusBadRequest}
	}
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}

	tag, err := db.Postgres.Exec(ctx, "DELETE FROM categories WHERE id = $1 AND server_id = $2", p.CategoryID, p.ServerID)
	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	if tag.RowsAffected() == 0 {
		return &httputil.ErrorResponse{Err: errors.New("category not found"), Code: http.StatusNotFound}
	}

	return nil
}
