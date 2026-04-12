package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterImagesRoutes(r *mux.Router) {
	s := r.PathPrefix("/image").Subrouter()

	s.HandleFunc("/upload", handlers.HandleUpload).Methods(http.MethodPost)
	s.HandleFunc("/delete", handlers.DeleteImage).Methods(http.MethodDelete)
}
