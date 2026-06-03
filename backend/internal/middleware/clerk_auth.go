package middleware

import (
	"net/http"

	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/gorilla/mux"
)

// ClerkAuth returns a mux.MiddlewareFunc that verifies the Clerk session token
// from the Authorization: Bearer <token> header.
// Unauthenticated requests are rejected with 401.
func ClerkAuth() mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return clerkhttp.WithHeaderAuthorization()(next)
	}
}
