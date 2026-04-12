package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterCategoriesRoute(r *mux.Router, ch *handlers.CategoryHandler) {
	cr := r.PathPrefix("/categories").Subrouter()

	cr.HandleFunc("", ch.FindAllCategories).Methods(http.MethodGet)
	cr.HandleFunc("", ch.CreateCategory).Methods(http.MethodPost)
}
