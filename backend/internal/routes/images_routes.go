package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterImagesRoutes(r *mux.Router, middlewares ...mux.MiddlewareFunc) {
	s := r.PathPrefix("/image").Subrouter()
	s.Use(middlewares...)

	s.HandleFunc("/upload", handlers.HandleUpload).Methods(http.MethodPost)
	s.HandleFunc("/delete", handlers.DeleteImage).Methods(http.MethodDelete)
}
