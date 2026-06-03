package middleware

import "github.com/gorilla/mux"

func SetupMiddleware(router *mux.Router) {
	router.Use(securityMiddleware)
	router.Use(corsMiddleware)
	// Ensures OPTIONS preflight requests get CORS headers even when the route
	// doesn't explicitly register OPTIONS as an allowed method.
	router.MethodNotAllowedHandler = MethodNotAllowedHandler()
}
