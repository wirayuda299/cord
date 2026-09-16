package handlers

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/users"
)

type UserHandler struct {
	db *databases.Container
}

func NewUserHandler(db *databases.Container) *UserHandler {
	return &UserHandler{db: db}
}

func (uh *UserHandler) FindUsersByName(w http.ResponseWriter, r *http.Request) {
	result, err := users.FindUsersByName(r.Context(), uh.db, r.URL.Query().Get("username"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "users found", http.StatusOK, result)
}

// CreateUser has no Clerk session to check — it's called server-to-server by
// the Next.js webhook route after that route verifies the Clerk/Svix
// signature, not by an end-user's browser. NEXT_PUBLIC_API_URL is a public,
// client-bundled value though, so without this shared-secret check anyone
// could call this endpoint directly, bypassing Svix verification entirely.
func (uh *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	secret := uh.db.Config.InternalAPISecret
	// Fail closed: an unset secret must never be treated as "no check
	// required," or a misconfigured deployment would silently reopen this
	// endpoint to the public internet.
	if secret == "" || subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Internal-Secret")), []byte(secret)) != 1 {
		httputil.WriteErrorResponse(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var p users.CreateUserPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := users.CreateUser(r.Context(), uh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "User created", http.StatusCreated, nil)
}


