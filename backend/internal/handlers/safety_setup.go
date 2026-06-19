package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/servers/safety"
)

type SafetySetupHandler struct {
	db  *databases.Container
	hub safety.Evictor
}

func NewSafetySetupHandler(db *databases.Container, hub safety.Evictor) *SafetySetupHandler {
	return &SafetySetupHandler{db: db, hub: hub}
}

func (sh *SafetySetupHandler) UpdateSafetySettings(w http.ResponseWriter, r *http.Request) {
	var p safety.UpdateSafetyPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	errRes := safety.UpdateServerSafetySettings(r.Context(), sh.db, &p)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}

	httputil.EncodeResponse(w, "Safety settings updated", http.StatusOK, nil)
}

func (sh *SafetySetupHandler) GetSafetySettings(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")
	if serverID == "" {
		httputil.WriteErrorResponse(w, "Server ID is required", http.StatusBadRequest)
		return
	}

	res, errRes := safety.GetServerSafetySettings(r.Context(), sh.db, serverID)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}

	httputil.EncodeResponse(w, "Safety settings fetched", http.StatusOK, res)
}

func (sh *SafetySetupHandler) BanMember(w http.ResponseWriter, r *http.Request) {
	var p safety.BanMemberPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	errRes := safety.BanMember(r.Context(), sh.db, sh.hub, &p)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}

	httputil.EncodeResponse(w, "Member banned successfully", http.StatusOK, nil)
}

func (sh *SafetySetupHandler) UnbanMember(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")
	memberID := r.URL.Query().Get("memberID")
	if serverID == "" || memberID == "" {
		httputil.WriteErrorResponse(w, "serverID and memberID are required", http.StatusBadRequest)
		return
	}

	errRes := safety.UnbanMember(r.Context(), sh.db, serverID, memberID)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}

	httputil.EncodeResponse(w, "Member unbanned successfully", http.StatusOK, nil)
}

func (sh *SafetySetupHandler) GetBannedMembers(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")
	if serverID == "" {
		httputil.WriteErrorResponse(w, "Server ID is required", http.StatusBadRequest)
		return
	}

	res, errRes := safety.FindBannedMembers(r.Context(), sh.db, serverID)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}

	httputil.EncodeResponse(w, "Banned members fetched", http.StatusOK, res)
}
