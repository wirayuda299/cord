package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterUserRoutes(r *mux.Router, uh *handlers.UserHandler) {
	ur := r.PathPrefix("/users").Subrouter()
	ur.HandleFunc("/create", uh.CreateUser).Methods(http.MethodPost)
}
