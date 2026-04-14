package invitations

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Invitation struct {
	Id        string    `json:"id"`
	Code      string    `json:"code"`
	ServerID  string    `json:"server_id"`
	CreatedBy string    `json:"created_by"`
	MaxUsers  string    `json:"max_users"`
	CreatedAt time.Time `json:"created_at"`
	Uses      int       `json:"uses"`
}

func GetAllInvitationCode(ctx context.Context, db *databases.Container, serverID string) ([]Invitation, *httputil.ErrorResponse) {
	if serverID == "" {
		return nil, &httputil.ErrorResponse{Err: errors.New("Server ID is missing"), Code: http.StatusBadRequest}
	}
	var invitations []Invitation

	rows, err := db.Postgres.Query(ctx, "SELECT id,code,server_id,created_by,max_users,created_at,uses from invitations where server_id = $1", serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	defer rows.Close()
	for rows.Next() {
		var i Invitation
		if err := rows.Scan(&i.Id, &i.Code, &i.ServerID, &i.CreatedBy, &i.MaxUsers, &i.CreatedAt, &i.Uses); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		invitations = append(invitations, i)
	}
	if err := rows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	return invitations, nil
}
