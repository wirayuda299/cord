package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterImagesRoutes(r *mux.Router, ih *handlers.ImageHandler, middlewares ...mux.MiddlewareFunc) {
	s := r.PathPrefix("/image").Subrouter()
	s.Use(middlewares...)

	s.HandleFunc("/upload", ih.HandleUpload).Methods(http.MethodPost)
	s.HandleFunc("/delete", ih.DeleteImage).Methods(http.MethodDelete)
}
