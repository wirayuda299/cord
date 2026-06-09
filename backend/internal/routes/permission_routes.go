package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterPermissionRoute(r *mux.Router, ph *handlers.PermissionHandler, middleware ...mux.MiddlewareFunc) {
	pr := r.PathPrefix("/permission").Subrouter()
	pr.Use(middleware...)

	pr.HandleFunc("/find", ph.FindPermissionByID).Methods(http.MethodGet)
	pr.HandleFunc("/has-permission", ph.HasPermission).Methods(http.MethodGet)
}
