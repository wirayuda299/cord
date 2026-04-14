package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterInvitationRoutes(r *mux.Router, ih *handlers.InvitationHandler) {
	ir := r.PathPrefix("/invitation").Subrouter()

	ir.HandleFunc("/find-all", ih.FindAllInvitations).Methods(http.MethodGet)
	ir.HandleFunc("/join", ih.JoinServerByCode).Methods(http.MethodPost)
	ir.HandleFunc("/create", ih.CreateInvitationCode).Methods(http.MethodPost)
}
