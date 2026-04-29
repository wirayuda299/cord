package handlers

import (
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/members"
)

type MemberHandler struct {
	db *databases.Container
}

func NewMemberHandler(db *databases.Container) *MemberHandler {
	return &MemberHandler{db: db}
}

func (mh *MemberHandler) FindAllMemberInServer(w http.ResponseWriter, r *http.Request) {
	memberInServer, err := members.FindAllMemberInServer(r.Context(), mh.db, r.URL.Query().Get("serverID"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Member found", http.StatusOK, memberInServer)
}

func (mh *MemberHandler) IsUserJoined(w http.ResponseWriter, r *http.Request) {
	joined, err := members.IsUserJoinedServer(r.Context(), mh.db, r.URL.Query().Get("user_id"), r.URL.Query().Get("server_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Success get member status", http.StatusOK, joined)
}
