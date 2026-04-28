package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/friends"
)

type FriendsHandler struct {
	db *databases.Container
}

func NewFriendHandler(db *databases.Container) *FriendsHandler {
	return &FriendsHandler{db: db}
}

type PendingRequestPayload struct {
	ID            string `json:"id"`
	CurrentUserID string `json:"current_user_id"`
}

func (fh *FriendsHandler) CancelFriendRequest(w http.ResponseWriter, r *http.Request) {

	var p PendingRequestPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := friends.CancelFriendRequest(r.Context(), fh.db, p.ID, p.CurrentUserID)

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Friend request canceled", http.StatusOK, nil)

}

func (fh *FriendsHandler) FindAllPendingInvitation(w http.ResponseWriter, r *http.Request) {

	result, err := friends.GetAllPendingInvitations(r.Context(), fh.db, r.URL.Query().Get("user_id"))

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Invitations found", http.StatusOK, result)
}

func (fh *FriendsHandler) SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	var p friends.SendFriendRequestPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := friends.SendFriendRequest(r.Context(), fh.db, &p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Friend request sent", http.StatusCreated, nil)
}
