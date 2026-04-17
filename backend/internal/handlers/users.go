package handlers

import (
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

func (uh *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
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
