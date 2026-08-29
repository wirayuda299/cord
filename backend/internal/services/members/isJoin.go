package members

import (
	"context"
	"errors"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/utils"
)

func IsUserJoinedServer(ctx context.Context, db *databases.Container, serverID string) (bool, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}

	if serverID == "dm" {
		return true, nil
	}

	if serverID == "" {
		return false, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	var joined bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(select 1 from members where server_id = $1 and user_id = $2)", serverID, userID).Scan(&joined)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	isOwnerQuery := "SELECT created_by FROM servers WHERE id = $1"
	var owner string
	err = db.Postgres.QueryRow(ctx, isOwnerQuery, serverID).Scan(&owner)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	if owner == userID {
		joined = true
		return joined, nil
	} else {
		return joined, nil
	}

}

func VerifyChannelAccess(ctx context.Context, db *databases.Container, channelID string) (bool, error) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return false, err
	}

	var serverID *string
	var channelType string
	err = db.Postgres.QueryRow(ctx, "SELECT server_id::text, channel_type FROM channels WHERE id = $1", channelID).Scan(&serverID, &channelType)
	if err != nil {
		return false, err
	}

	if serverID != nil && *serverID != "" {
		var joined bool
		err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM members WHERE server_id = $1 AND user_id = $2)", *serverID, userID).Scan(&joined)
		if err != nil {
			return false, err
		}

		var owner string
		err = db.Postgres.QueryRow(ctx, "SELECT created_by FROM servers WHERE id = $1", *serverID).Scan(&owner)
		if err == nil && owner == userID {
			return true, nil
		}

		return joined, nil
	}

	var isMember bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2)", channelID, userID).Scan(&isMember)
	return isMember, err
}

func IsUserBannedFromServer(ctx context.Context, db *databases.Container, serverID string) (bool, *httputil.ErrorResponse) {
	userID, err := utils.GetSession(ctx)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: errors.New("unauthorized"), Code: http.StatusUnauthorized}
	}

	if serverID == "" {
		return false, &httputil.ErrorResponse{Err: errors.New("server ID is missing"), Code: http.StatusBadRequest}
	}

	// DMs have no server, so a user can never be "banned" from one.
	if serverID == "dm" {
		return false, nil
	}

	var banned bool
	err = db.Postgres.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM bans WHERE server_id = $1 AND user_id = $2)", serverID, userID).Scan(&banned)
	if err != nil {
		return false, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return banned, nil
}


