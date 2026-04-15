package invitations

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type InvitationResponse struct {
	Invitation
	ServerName   string   `json:"server_name"`
	Username     string   `json:"username"`
	Member_count int      `json:"member_count"`
	Logo         *string  `json:"logo"`
	BannerColor  []string `json:"banner_color"`
}

func FindInvitationByCode(ctx context.Context, db *databases.Container, code string) (*InvitationResponse, *httputil.ErrorResponse) {
	if code == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Invitation code is missing"), Code: http.StatusBadRequest}
	}
	var i InvitationResponse
	err := db.Postgres.QueryRow(ctx, `
		SELECT i.id,i.code,i.server_id,i.created_by,i.max_users,i.created_at,i.uses,u.username,s.name,s.logo,
		(select count(*) from members as m where m.server_id = i.server_id) as member_count,s.banner_colors
		from invitations as i
		left join users as u on u.id = i.created_by
		left join servers as s on s.id = i.server_id
	 	where code = $1;`, code).Scan(&i.Id, &i.Code, &i.ServerID, &i.CreatedBy, &i.MaxUsers, &i.CreatedAt, &i.Uses, &i.Username, &i.ServerName, &i.Logo, &i.Member_count, &i.BannerColor)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return &i, nil
}
