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

type UpdateServerProfilePayload struct {
	ServerID      string  `json:"server_id"`
	UserID        string  `json:"user_id"`
	Username      *string `json:"username"`
	Avatar        *string `json:"avatar"`
	AvatarAssetID *string `json:"avatar_asset_id"`
	Bio           *string `json:"bio"`
}

func UpdateServerProfile(ctx context.Context, db *databases.Container, p *UpdateServerProfilePayload) *httputil.ErrorResponse {
	if p.ServerID == "" {
		return &httputil.ErrorResponse{Err: errors.New("server_id is required"), Code: http.StatusBadRequest}
	}
	if p.UserID == "" {
		return &httputil.ErrorResponse{Err: errors.New("user_id is required"), Code: http.StatusBadRequest}
	}

	setClauses := []string{}
	args := []any{}
	idx := 1

	if p.Username != nil {
		setClauses = append(setClauses, fmt.Sprintf("username = $%d", idx))
		args = append(args, *p.Username)
		idx++
	}
	if p.Bio != nil {
		setClauses = append(setClauses, fmt.Sprintf("bio = $%d", idx))
		args = append(args, *p.Bio)
		idx++
	}
	if p.Avatar != nil && p.AvatarAssetID != nil {
		var oldAvatarID *string
		_ = db.Postgres.QueryRow(ctx, "SELECT avatar_asset_id FROM server_profile WHERE server_id = $1 AND user_id = $2", p.ServerID, p.UserID).Scan(&oldAvatarID)

		setClauses = append(setClauses, fmt.Sprintf("avatar = $%d", idx), fmt.Sprintf("avatar_asset_id = $%d", idx+1))
		args = append(args, *p.Avatar, *p.AvatarAssetID)
		idx += 2

		if oldAvatarID != nil && *oldAvatarID != "" && *oldAvatarID != *p.AvatarAssetID {
			if err := queue.PushJob(ctx, db.Redis, queue.DeleteImage, queue.DeleteImagePayload{PublicID: *oldAvatarID}); err != nil {
				return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
			}
		}
	}

	if len(setClauses) == 0 {
		return nil
	}

	args = append(args, p.ServerID, p.UserID)
	query := fmt.Sprintf(
		"UPDATE server_profile SET %s WHERE server_id = $%d AND user_id = $%d",
		strings.Join(setClauses, ", "),
		idx, idx+1,
	)

	if _, err := db.Postgres.Exec(ctx, query, args...); err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
