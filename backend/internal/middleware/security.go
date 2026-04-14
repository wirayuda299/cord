package middleware

import (
	"net/http"
	"path"
	"strings"
)

func securityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleaned := path.Clean(r.URL.Path)
		if strings.Contains(cleaned, "..") {
			http.Error(w, "403 Forbidden", http.StatusForbidden)
			return
		}
		r.URL.Path = cleaned
		next.ServeHTTP(w, r)
	})
}
