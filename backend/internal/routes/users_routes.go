package routes

import (
	"net/http"

	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterUserRoutes(r *mux.Router, uh *handlers.UserHandler) {
	ur := r.PathPrefix("/users").Subrouter()

	ur.Handle("/find-by-name", clerkhttp.WithHeaderAuthorization()(http.HandlerFunc(uh.FindUsersByName))).Methods(http.MethodGet)
	ur.HandleFunc("/create", uh.CreateUser).Methods(http.MethodPost)
	ur.HandleFunc("/update", uh.UpdateUser).Methods(http.MethodPut, http.MethodPatch)
	ur.HandleFunc("/delete", uh.DeleteUser).Methods(http.MethodDelete)
}
