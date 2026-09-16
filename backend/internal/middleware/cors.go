package middleware

import (
	"net/http"
)

func corsHeaders(w http.ResponseWriter, clientURL string) {
	headers := w.Header()
	headers.Set("Access-Control-Allow-Origin", clientURL)
	headers.Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, PATCH, DELETE")
	headers.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept, X-Requested-With")
	headers.Set("Access-Control-Allow-Credentials", "true")
	headers.Set("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours
}

func corsMiddleware(clientURL string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			corsHeaders(w, clientURL)

			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("Content-Type", "application/json")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// MethodNotAllowedHandler handles the case where gorilla/mux rejects a method
// (e.g. an OPTIONS preflight on a route that only has POST/DELETE registered).
// Without this, mux returns 405 before the corsMiddleware can write CORS headers.
func MethodNotAllowedHandler(clientURL string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		corsHeaders(w, clientURL)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.WriteHeader(http.StatusMethodNotAllowed)
	})
}

// CORSHandler wraps the entire router as the outermost handler.
// gorilla/mux's router.Use() middleware is skipped for requests that don't
// match a route (e.g. OPTIONS preflight on a POST-only route), so we must
// intercept at the http.Server level before mux does any routing.
func CORSHandler(clientURL string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		corsHeaders(w, clientURL)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
