package servers

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

type BrowsableServer struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Logo        string `json:"logo"`
	MemberCount int    `json:"member_count"`
}

func BrowseServers(ctx context.Context, db *databases.Container) ([]BrowsableServer, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusUnauthorized}
	}

	rows, err := db.Postgres.Query(ctx, `
		SELECT s.id,
		s.name,
		COALESCE(s.logo, '') as logo,
		(SELECT COUNT(*) FROM members WHERE server_id = s.id) as member_count
		FROM servers s
		WHERE s.private = false
		  AND s.created_by != $1
		  AND s.id NOT IN (SELECT server_id FROM members WHERE user_id = $1)
		ORDER BY member_count DESC
	`, userID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer rows.Close()

	var list []BrowsableServer
	for rows.Next() {
		var s BrowsableServer
		if err := rows.Scan(&s.Id, &s.Name, &s.Logo, &s.MemberCount); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		list = append(list, s)
	}
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return list, nil
}
