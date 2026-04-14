package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterPermissionRoute(r *mux.Router, ph *handlers.PermissionHandler) {
	pr := r.PathPrefix("/permission").Subrouter()

	pr.HandleFunc("/find", ph.FindPermissionByID).Methods(http.MethodGet)
}
