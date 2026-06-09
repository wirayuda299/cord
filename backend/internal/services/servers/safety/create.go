package safety

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

func CreateDefaultServerSafety(ctx context.Context, db *databases.Container, serverID string, createdBy string) *httputil.ErrorResponse {

	_, err := db.Postgres.Exec(ctx, `INSERT INTO safety_setup(level,server_id,created_by) values($1,$2,$3)`, "low", serverID, createdBy)

	if err != nil {
		return &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return nil
}
