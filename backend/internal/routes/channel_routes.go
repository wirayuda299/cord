package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterChannelRoutes(r *mux.Router, ch *handlers.ChannelHandler) {
	s := r.PathPrefix("/channel").Subrouter()

	s.HandleFunc("", ch.GetChannelById).Methods(http.MethodGet)
	s.HandleFunc("/create", ch.CreateChannel).Methods(http.MethodPost)
	s.HandleFunc("/find-all", ch.FindAllChannelsInAServer).Methods(http.MethodGet)
}
