package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func ServerRoutes(r *mux.Router, sh *handlers.ServerHandler) {
	s := r.PathPrefix("/server").Subrouter()

	s.HandleFunc("", sh.GetServerByID).Methods(http.MethodGet)
	s.HandleFunc("/find-all", sh.FindAllServersByUserId).Methods(http.MethodGet)
	s.HandleFunc("/create", sh.CreateServer).Methods(http.MethodPost)
	s.HandleFunc("/{code}/join", sh.JoinServerByCode).Methods(http.MethodPost)
	s.HandleFunc("/invitation/create", sh.CreateInvitationCode).Methods(http.MethodPost)
	s.HandleFunc("/update", sh.UpdateServer).Methods(http.MethodPatch)
}
