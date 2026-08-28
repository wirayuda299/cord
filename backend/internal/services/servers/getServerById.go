package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/utils"
)

type Server struct {
	Id           string   `json:"id"`
	Name         string   `json:"name"`
	Logo         *string  `json:"logo"`
	LogoID       *string  `json:"logo_id"`
	OwnerID      string   `json:"owner_id"`
	Banner       *string  `json:"banner"`
	BannerID     *string  `json:"banner_id"`
	Description  *string  `json:"description"`
	Private      bool     `json:"private"`
	BannerColors []string `json:"banner_colors"`
}

func GetServerByID(db *databases.Container, ctx context.Context, serverID string) (*Server, *httputil.ErrorResponse) {
	_, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	joined, joinErr := members.IsUserJoinedServer(ctx, db, serverID)
	if joinErr != nil {
		return nil, joinErr
	}
	if !joined {
		return nil, &httputil.ErrorResponse{Err: errors.New("forbidden: you are not a member of this server"), Code: http.StatusForbidden}
	}

	var server Server

	err = db.Postgres.QueryRow(ctx, "SELECT id,name,logo,logo_id,created_by,banner,banner_id,description, private,banner_colors from servers where id = $1", serverID).Scan(&server.Id, &server.Name, &server.Logo, &server.LogoID, &server.OwnerID, &server.Banner, &server.BannerID, &server.Description, &server.Private, &server.BannerColors)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: errors.New("server not found"), Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return &server, nil
}
