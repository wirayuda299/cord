package middleware

import "github.com/gorilla/mux"

func SetupMiddleware(router *mux.Router) {
	router.Use(securityMiddleware)
	router.Use(corsMiddleware)
}
