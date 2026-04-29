package internal

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
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

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := apiServer.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown with error: %v", err)
	}

	log.Println("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func (s *Server) Run() {
	r := mux.NewRouter()

	hub := websocket.NewHub()
	go hub.Run()

	middleware.SetupMiddleware(r)

	ch := handlers.NewChannelHandler(s.db)
	categoryHandler := handlers.NewCategoryHandler(s.db)
	sh := handlers.NewServerHandler(s.db)
	mh := handlers.NewMessageHandler(s.db)
	rh := handlers.NewRoleHandler(s.db)
	ph := handlers.NewPermissionHandler(s.db)
	mrh := handlers.NewMemberHandler(s.db)
	ih := handlers.NewInvitationHandler(s.db)
	uh := handlers.NewUserHandler(s.db)
	fh := handlers.NewFriendHandler(s.db)

	routes.RegisterFriendRoutes(r, fh)
	routes.RegisterUserRoutes(r, uh)
	routes.RegisterMemberRoutes(r, mrh)
	routes.RegisterInvitationRoutes(r, ih)
	routes.RegisterPermissionRoute(r, ph)
	routes.RegisterRoleRoute(r, rh)
	routes.RegisterChannelRoutes(r, ch)
	routes.RegisterImagesRoutes(r)
	routes.ServerRoutes(r, sh)
	routes.WebSocketRoutes(r, hub, s.db)
	routes.MessagesRoutes(r, mh, hub)
	routes.RegisterCategoriesRoute(r, categoryHandler)

	done := make(chan bool, 1)

	server := &http.Server{
		Handler:      r,
		Addr:         ":" + "8080",
		WriteTimeout: 20 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	fmt.Println("Listening on port 8080...")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("server failed to start:", err)
	}

	go gracefulShutdown(server, done)

	// Wait for the graceful shutdown to complete
	<-done
	log.Println("Graceful shutdown complete.")

}
