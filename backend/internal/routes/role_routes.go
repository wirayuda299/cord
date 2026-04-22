package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterRoleRoute(r *mux.Router, rh *handlers.RoleHandler) {
	rs := r.PathPrefix("/roles").Subrouter()

	rs.HandleFunc("", rh.DeleteRole).Methods(http.MethodDelete)
	rs.HandleFunc("/unassign", rh.UnassignRole).Methods(http.MethodDelete)
	rs.HandleFunc("/create", rh.CreateRole).Methods(http.MethodPost)
	rs.HandleFunc("/assign", rh.AssignRole).Methods(http.MethodPost)
	rs.HandleFunc("/update", rh.UpdateRole).Methods(http.MethodPatch)
	rs.HandleFunc("/find-all", rh.GetAllRole).Methods(http.MethodGet)
	rs.HandleFunc("/find-all-members", rh.FindAllMemberInRole).Methods(http.MethodGet)
}
