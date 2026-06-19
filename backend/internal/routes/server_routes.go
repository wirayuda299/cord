package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func ServerRoutes(r *mux.Router, sh *handlers.ServerHandler, ssh *handlers.SafetySetupHandler, middleware ...mux.MiddlewareFunc) {
	s := r.PathPrefix("/server").Subrouter()
	s.Use(middleware...)

	s.HandleFunc("", sh.GetServerByID).Methods(http.MethodGet)
	s.HandleFunc("", sh.DeleteServer).Methods(http.MethodDelete)
	s.HandleFunc("/find-all", sh.FindAllServersByUserID).Methods(http.MethodGet)
	s.HandleFunc("/browse", sh.BrowseServers).Methods(http.MethodGet)
	s.HandleFunc("/create", sh.CreateServer).Methods(http.MethodPost)
	s.HandleFunc("/join", sh.JoinServer).Methods(http.MethodPost)
	s.HandleFunc("/update", sh.UpdateServer).Methods(http.MethodPatch)
	s.HandleFunc("/profile", sh.GetServerProfile).Methods(http.MethodGet)
	s.HandleFunc("/profile/update", sh.UpdateServerProfile).Methods(http.MethodPatch)
	s.HandleFunc("/safety", ssh.GetSafetySettings).Methods(http.MethodGet)
	s.HandleFunc("/safety", ssh.UpdateSafetySettings).Methods(http.MethodPut, http.MethodPatch)
	s.HandleFunc("/bans", ssh.GetBannedMembers).Methods(http.MethodGet)
	s.HandleFunc("/bans", ssh.BanMember).Methods(http.MethodPost)
	s.HandleFunc("/bans", ssh.UnbanMember).Methods(http.MethodDelete)
	s.HandleFunc("/audit-logs", sh.GetAuditLogs).Methods(http.MethodGet)
}
