package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/websocket"
)

func WebSocketRoutes(r *mux.Router, hub *websocket.Hub, db *databases.Container) {

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(hub, db, w, r)
	})

}
