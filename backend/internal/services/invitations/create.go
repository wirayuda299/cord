package invitations

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type CreateInvitationType struct {
	ServerId  string `json:"server_id"`
	MaxUsers  uint8  `json:"max_users"`
	CreatedBy string `json:"created_by"`
}

func generateInviteCode() (string, error) {
	bytes := make([]byte, 8) // 8 bytes = ~11 base64 chars, we trim to 10
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}

	code := base64.URLEncoding.EncodeToString(bytes)[:10] // URL-safe, no +/
	return code, nil                                      // e.g. "aB3xK9mZ2Q"
}

func CreateInvitationCode(ctx context.Context, db *databases.Container, p CreateInvitationType) (string, *httputil.ErrorResponse) {
	fmt.Println("Payload -> ", p)
	if p.ServerId == "" {
		return "", &httputil.ErrorResponse{
			Err:  errors.New("server ID is missing"),
			Code: http.StatusBadRequest,
		}
	}

	var isExist bool

	if err := db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from servers where id = $1)", p.ServerId).Scan(&isExist); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", &httputil.ErrorResponse{
				Err:  errors.New("server doesn't exists"),
				Code: http.StatusNotFound,
			}
		} else {
			return "", &httputil.ErrorResponse{
				Err:  err,
				Code: http.StatusInternalServerError,
			}
		}
	}

	var code string
	generatedCode, err := generateInviteCode()
	if err != nil {
		return "", &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	err = db.Postgres.QueryRow(ctx, "INSERT INTO invitations(code,server_id,max_users,created_by) VALUES($1,$2,$3,$4) returning code;", generatedCode, p.ServerId, p.MaxUsers, p.CreatedBy).Scan(&code)
	if err != nil {
		return "", &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return code, nil
}
