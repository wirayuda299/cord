package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterFriendRoutes(r *mux.Router, fh *handlers.FriendsHandler, middleware ...mux.MiddlewareFunc) {
	fr := r.PathPrefix("/friends").Subrouter()

	fr.Use(middleware...)
	fr.HandleFunc("", fh.FindAllFriends).Methods(http.MethodGet)
	fr.HandleFunc("/send-request", fh.SendFriendRequest).Methods(http.MethodPost)
	fr.HandleFunc("/pending", fh.FindAllPendingInvitation).Methods(http.MethodGet)
	fr.HandleFunc("/cancel", fh.CancelFriendRequest).Methods(http.MethodDelete)
	fr.HandleFunc("/accept", fh.AcceptFriendRequest).Methods(http.MethodPost)
	fr.HandleFunc("/decline", fh.DeclineFriendRequest).Methods(http.MethodPost)
}
