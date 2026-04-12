package middleware

import (
	"net/http"
	"os"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		headers := w.Header()
		headers.Set("Access-Control-Allow-Origin", os.Getenv("CLIENT_URL"))
		headers.Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE")
		headers.Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, Accept, X-Requested-With")
		headers.Set("Access-Control-Allow-Credentials", "true")
		headers.Set("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours

		headers.Set("X-Content-Type-Options", "nosniff")
		headers.Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
