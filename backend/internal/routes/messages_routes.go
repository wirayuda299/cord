package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
	"github.com/wirayuda299/backend/internal/websocket"
)

func MessagesRoutes(r *mux.Router, mh *handlers.MessageHandler, hub *websocket.Hub) {
	s := r.PathPrefix("/messages").Subrouter()

	s.HandleFunc("", mh.FindAllMessages).Methods(http.MethodGet)
	s.HandleFunc("", mh.DeleteMessage).Methods(http.MethodDelete)

	p := s.PathPrefix("/pin").Subrouter()
	p.HandleFunc("/find-all", mh.FindAllPinnedMessages).Methods(http.MethodGet)
	p.HandleFunc("", mh.DeletePinnedMessage).Methods(http.MethodDelete)
	p.HandleFunc("", mh.PinMessage).Methods(http.MethodPost)

}
