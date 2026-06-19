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

func (uh *UserHandler) FindUsersByName(w http.ResponseWriter, r *http.Request) {
	result, err := users.FindUsersByName(r.Context(), uh.db, r.URL.Query().Get("username"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "users found", http.StatusOK, result)
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

func (uh *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var p users.UpdateUserPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := users.UpdateUser(r.Context(), uh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "User updated", http.StatusOK, nil)
}

func (uh *UserHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	var p users.DeleteUserPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := users.DeleteUser(r.Context(), uh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "User deleted", http.StatusOK, nil)
}

