package handlers

import (
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	permissionService "github.com/wirayuda299/backend/internal/services/permissions"
)

type PermissionHandler struct {
	db *databases.Container
}

func NewPermissionHandler(db *databases.Container) *PermissionHandler {
	return &PermissionHandler{db: db}
}

func (ph *PermissionHandler) FindPermissionByID(w http.ResponseWriter, r *http.Request) {
	permissions, err := permissionService.FindPermissionByRoleID(r.Context(), ph.db, r.URL.Query().Get("role_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Permission found", http.StatusOK, permissions)
}
