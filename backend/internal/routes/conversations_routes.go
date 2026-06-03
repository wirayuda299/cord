package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterConversationRoute(r *mux.Router, ch *handlers.ConversationHandler, middleware ...mux.MiddlewareFunc) {
	cr := r.PathPrefix("/conversation").Subrouter()

	cr.Use(middleware...)

	cr.HandleFunc("", ch.FindAllConversations).Methods(http.MethodGet)
	cr.HandleFunc("/find-one", ch.FindConversationByID).Methods(http.MethodGet)
	cr.HandleFunc("/create", ch.CreateConversation).Methods(http.MethodPost)
	cr.HandleFunc("", ch.DeleteConversation).Methods(http.MethodDelete)
}
