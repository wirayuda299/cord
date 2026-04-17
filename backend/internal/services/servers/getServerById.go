package servers

import (
	"context"
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
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
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}

	var server Server

	err := db.Postgres.QueryRow(ctx, "SELECT id,name,logo,logo_id,created_by,banner,banner_id,description, private,banner_colors from servers where id = $1", serverID).Scan(&server.Id, &server.Name, &server.Logo, &server.LogoID, &server.OwnerID, &server.Banner, &server.BannerID, &server.Description, &server.Private, &server.BannerColors)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, &httputil.ErrorResponse{Err: errors.New("Server not found"), Code: http.StatusNotFound}
		}
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return &server, nil
}
