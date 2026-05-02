package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterFriendRoutes(r *mux.Router, fh *handlers.FriendsHandler) {
	fr := r.PathPrefix("/friends").Subrouter()

	fr.HandleFunc("", fh.FindAllFriends).Methods(http.MethodGet)
	fr.HandleFunc("/send-request", fh.SendFriendRequest).Methods(http.MethodPost)
	fr.HandleFunc("/pending", fh.FindAllPendingInvitation).Methods(http.MethodGet)
	fr.HandleFunc("/cancel", fh.CancelFriendRequest).Methods(http.MethodDelete)
}
