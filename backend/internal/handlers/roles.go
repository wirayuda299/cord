package handlers

import (
	"encoding/json"
	"log"
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

func (rh *RoleHandler) FindAllMemberInRole(w http.ResponseWriter, r *http.Request) {
	members, err := roles.FindAllMemberByRole(r.Context(), rh.db, r.URL.Query().Get("role_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Members found", http.StatusOK, members)
}

func (rh *RoleHandler) AssignRole(w http.ResponseWriter, r *http.Request) {

	var p roles.AssignRolePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := roles.AssignRole(r.Context(), rh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Role assigned", http.StatusOK, nil)
}

func (rh *RoleHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	var p roles.DeleteRolePayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := roles.DeleteRole(r.Context(), rh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Role deleted", http.StatusOK, nil)
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
	allRoles, err := roles.GetAllRoles(r.Context(), rh.db, r.URL.Query().Get("serverID"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Roles found", http.StatusOK, allRoles)
}

func (rh *RoleHandler) UnassignRole(w http.ResponseWriter, r *http.Request) {
	var p roles.UnassignRolePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := roles.UnassignRole(r.Context(), rh.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Role unassigned", http.StatusOK, nil)
}

func (rh *RoleHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	var p roles.UpdatePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Println("Payload => ", p)
	err := roles.UpdateRole(r.Context(), rh.db, p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), http.StatusInternalServerError)
		return
	}

	httputil.EncodeResponse(w, "Role updated", http.StatusCreated, nil)
}
