package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterChannelRoutes(r *mux.Router, ch *handlers.ChannelHandler, middleware ...mux.MiddlewareFunc) {
	s := r.PathPrefix("/channel").Subrouter()
	s.Use(middleware...)

	s.HandleFunc("", ch.GetChannelByID).Methods(http.MethodGet)
	s.HandleFunc("", ch.UpdateChannel).Methods(http.MethodPatch)
	s.HandleFunc("", ch.DeleteChannel).Methods(http.MethodDelete)
	s.HandleFunc("/create", ch.CreateChannel).Methods(http.MethodPost)
	s.HandleFunc("/find-all", ch.FindAllChannelsInAServer).Methods(http.MethodGet)
}
