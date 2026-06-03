package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterThreadRoute(r *mux.Router, th *handlers.ThreadHandler, middleware ...mux.MiddlewareFunc) {
	tr := r.PathPrefix("/threads").Subrouter()
	tr.Use(middleware...)
	tr.HandleFunc("", th.FindThreadByID).Methods(http.MethodGet)
	tr.HandleFunc("/create", th.CreateThread).Methods(http.MethodPost)
	tr.HandleFunc("/find-messages", th.FindAllThreadMessages).Methods(http.MethodGet)
}
