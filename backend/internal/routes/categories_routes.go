package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterCategoriesRoute(r *mux.Router, ch *handlers.CategoryHandler, middleware ...mux.MiddlewareFunc) {
	cr := r.PathPrefix("/categories").Subrouter()
	cr.Use(middleware...)

	cr.HandleFunc("", ch.FindAllCategories).Methods(http.MethodGet)
	cr.HandleFunc("", ch.CreateCategory).Methods(http.MethodPost)
	cr.HandleFunc("", ch.UpdateCategory).Methods(http.MethodPatch)
	cr.HandleFunc("", ch.DeleteCategory).Methods(http.MethodDelete)
}
