package config

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/handlers"
	"github.com/wirayuda299/backend/internal/middleware"
	"github.com/wirayuda299/backend/internal/routes"
	"github.com/wirayuda299/backend/internal/websocket"
)

type Server struct {
	db *databases.Container
}

func NewServer(db *databases.Container) *Server {
	return &Server{db: db}
}

func (s *Server) Run() {
	r := mux.NewRouter()

	hub := websocket.NewHub()
	go hub.Run()

	middleware.SetupMiddleware(r)

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello world"))
	})
	ch := handlers.NewChannelHandler(s.db)
	categoryHandler := handlers.NewCategoryHandler(s.db)
	sh := handlers.NewServerHandler(s.db)
	mh := handlers.NewMessageHandler(s.db)

	routes.RegisterChannelRoutes(r, ch)
	routes.RegisterImagesRoutes(r)
	routes.ServerRoutes(r, sh)
	routes.WebSocketRoutes(r, hub, s.db)
	routes.MessagesRoutes(r, mh, hub)
	routes.RegisterCategoriesRoute(r, categoryHandler)

	server := &http.Server{
		Handler:      r,
		Addr:         ":" + "8080",
		WriteTimeout: 20 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	fmt.Println("Listening on port 8080...")

	server.ListenAndServe()
}
