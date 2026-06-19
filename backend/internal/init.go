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

func gracefulShutdown(srv *http.Server, done chan bool) {
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
	if err := srv.Shutdown(ctx); err != nil {
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
	cth := handlers.NewCategoryHandler(s.db)
	sh := handlers.NewServerHandler(s.db, hub)
	mh := handlers.NewMessageHandler(s.db, hub)
	rh := handlers.NewRoleHandler(s.db)
	ph := handlers.NewPermissionHandler(s.db)
	mrh := handlers.NewMemberHandler(s.db, hub)
	ih := handlers.NewInvitationHandler(s.db)
	uh := handlers.NewUserHandler(s.db)
	fh := handlers.NewFriendHandler(s.db)
	crh := handlers.NewConversationHandler(s.db)
	th := handlers.NewThreadHandler(s.db, hub)
	ssh := handlers.NewSafetySetupHandler(s.db, hub)

	routes.RegisterThreadRoute(r, th, middleware.ClerkAuth())
	routes.RegisterConversationRoute(r, crh, middleware.ClerkAuth())
	routes.RegisterFriendRoutes(r, fh, middleware.ClerkAuth())
	routes.RegisterUserRoutes(r, uh)
	routes.RegisterMemberRoutes(r, mrh, middleware.ClerkAuth())
	routes.RegisterInvitationRoutes(r, ih, middleware.ClerkAuth())
	routes.RegisterPermissionRoute(r, ph, middleware.ClerkAuth())
	routes.RegisterRoleRoute(r, rh, middleware.ClerkAuth())
	routes.RegisterChannelRoutes(r, ch, middleware.ClerkAuth())
	routes.RegisterImagesRoutes(r, middleware.ClerkAuth())
	routes.ServerRoutes(r, sh, ssh, middleware.ClerkAuth())
	routes.WebSocketRoutes(r, hub, s.db)
	routes.MessagesRoutes(r, mh, hub, middleware.ClerkAuth())
	routes.RegisterCategoriesRoute(r, cth, middleware.ClerkAuth())

	done := make(chan bool, 1)

	server := &http.Server{
		Handler:      middleware.CORSHandler(r),
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
