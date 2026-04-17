package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/servers"
)

type JoinServerWithCode struct {
	Code   string `json:"code"`
	UserId string `json:"user_id"`
}

type ServerHandler struct {
	db *databases.Container
}

func NewServerHandler(db *databases.Container) *ServerHandler {
	return &ServerHandler{db}
}

func (sh *ServerHandler) JoinServer(w http.ResponseWriter, r *http.Request) {
	var p servers.JoinServerPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := servers.JoinServer(r.Context(), sh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), http.StatusInternalServerError)
		return
	}

	httputil.EncodeResponse(w, "Success", http.StatusOK, nil)
}

func (sh *ServerHandler) GetServerByID(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")
	server, err := servers.GetServerByID(sh.db, r.Context(), serverID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Server found", http.StatusOK, server)
}

func (sh *ServerHandler) CreateServer(w http.ResponseWriter, r *http.Request) {
	var server servers.ServerPayload

	if err := json.NewDecoder(r.Body).Decode(&server); err != nil {
		httputil.WriteErrorResponse(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := servers.CreateServer(r.Context(), sh.db, &server); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Server created successfully", http.StatusCreated, nil)
}

func (sh *ServerHandler) UpdateServer(w http.ResponseWriter, r *http.Request) {
	var p servers.UpdateServerPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if err := servers.UpdateServer(r.Context(), sh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Server updated successfully", http.StatusOK, nil)
}

func (sh *ServerHandler) FindAllServersByUserId(w http.ResponseWriter, r *http.Request) {
	user_id := r.URL.Query().Get("user_id")

	res, err := servers.GetAllServersByUserId(r.Context(), sh.db, user_id)
	if err != nil {
		log.Println(err.Err.Error())
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Servers fetched sucessfully", http.StatusOK, res)
}
