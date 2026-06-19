package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/members"
)

type MemberHandler struct {
	db  *databases.Container
	hub members.Evictor
}

func NewMemberHandler(db *databases.Container, hub members.Evictor) *MemberHandler {
	return &MemberHandler{db: db, hub: hub}
}

func (mh *MemberHandler) KickMember(w http.ResponseWriter, r *http.Request) {

	var p members.KickMemberPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := members.KickMember(r.Context(), mh.db, mh.hub, p)

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "member kicked", http.StatusOK, nil)
}

func (mh *MemberHandler) FindAllMemberInServer(w http.ResponseWriter, r *http.Request) {
	memberInServer, err := members.FindMembersInServer(r.Context(), mh.db, r.URL.Query().Get("serverID"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Member found", http.StatusOK, memberInServer)
}

func (mh *MemberHandler) IsUserJoined(w http.ResponseWriter, r *http.Request) {
	joined, err := members.IsUserJoinedServer(r.Context(), mh.db, r.URL.Query().Get("server_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Success get member status", http.StatusOK, joined)
}

func (mh *MemberHandler) IsUserBanned(w http.ResponseWriter, r *http.Request) {
	banned, err := members.IsUserBannedFromServer(r.Context(), mh.db, r.URL.Query().Get("server_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Success get ban status", http.StatusOK, banned)
}

