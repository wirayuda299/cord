package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/roles"
)

type RoleHandler struct {
	db *databases.Container
}

func NewRoleHandler(db *databases.Container) *RoleHandler {
	return &RoleHandler{db: db}
}

func (rh *RoleHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var p roles.CreateRolePayload
	err := json.NewDecoder(r.Body).Decode(&p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	errResp := roles.CreateRole(r.Context(), rh.db, &p)
	if errResp != nil {
		httputil.WriteErrorResponse(w, errResp.Err.Error(), errResp.Code)
		return
	}

	httputil.EncodeResponse(w, "Role created", http.StatusCreated, nil)
}

func (rh *RoleHandler) GetAllRole(w http.ResponseWriter, r *http.Request) {
	roles, err := roles.GetAllRoles(r.Context(), rh.db, r.URL.Query().Get("serverID"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Roles found", http.StatusOK, roles)
}
