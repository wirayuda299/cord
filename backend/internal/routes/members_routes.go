package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/wirayuda299/backend/internal/handlers"
)

func RegisterMemberRoutes(r *mux.Router, mh *handlers.MemberHandler) {
	mr := r.PathPrefix("/members").Subrouter()
	mr.HandleFunc("/is-join", mh.IsUserJoined).Methods(http.MethodGet)
}
