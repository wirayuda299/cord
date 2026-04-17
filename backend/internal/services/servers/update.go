package servers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
)

type UpdateServerPayload struct {
	ServerID     string   `json:"server_id"`
	Name         *string  `json:"name"`
	Icon         *string  `json:"icon"`
	IconAssetID  *string  `json:"icon_asset_id"`
	BannerColors []string `json:"banner_colors"`
	Description  *string  `json:"description"`
	Private      *bool    `json:"private"`
}

func UpdateServer(ctx context.Context, db *databases.Container, p *UpdateServerPayload) *httputil.ErrorResponse {
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server ID is required"), Code: http.StatusBadRequest}
	}

	setClauses := []string{}
	args := []any{}
	idx := 1

	if p.Name != nil {
		setClauses = append(setClauses, fmt.Sprintf("name = $%d", idx))
		args = append(args, *p.Name)
		idx++
	}
	if p.BannerColors != nil {
		setClauses = append(setClauses, fmt.Sprintf("banner_colors = $%d", idx))
		args = append(args, p.BannerColors)
		idx++
	}
	if p.Description != nil {
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", idx))
		args = append(args, *p.Description)
		idx++
	}
	if p.Private != nil {
		setClauses = append(setClauses, fmt.Sprintf("private = $%d", idx))
		args = append(args, *p.Private)
		idx++
	}
	var oldLogoID *string
	if p.Icon != nil && *p.Icon != "" && p.IconAssetID != nil {
		findLogoErr := db.Postgres.QueryRow(ctx, "SELECT logo_id FROM servers WHERE id = $1", p.ServerID).Scan(&oldLogoID)
		if findLogoErr != nil {
			return &httputil.ErrorResponse{Err: findLogoErr, Code: http.StatusInternalServerError}
		}

		setClauses = append(setClauses,
			fmt.Sprintf("logo = $%d", idx),
			fmt.Sprintf("logo_id = $%d", idx+1),
		)
		args = append(args, *p.Icon, *p.IconAssetID)
		idx += 2
	}

	if len(setClauses) == 0 {
		return nil
	}

	args = append(args, p.ServerID)
	query := fmt.Sprintf(
		"UPDATE servers SET %s WHERE id = $%d",
		strings.Join(setClauses, ", "),
		idx,
	)

	if _, err := db.Postgres.Exec(ctx, query, args...); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if oldLogoID != nil && *oldLogoID != "" {
		if err := queue.PushJob(ctx, db.Redis, queue.DeleteImage, queue.DeleteImagePayload{
			PublicID: *oldLogoID,
			ServerID: p.ServerID,
		}); err != nil {
			return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
	}

	return nil
}
