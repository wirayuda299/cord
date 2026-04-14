package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/invitations"
)

type InvitationHandler struct {
	db *databases.Container
}

func NewInvitationHandler(db *databases.Container) *InvitationHandler {
	return &InvitationHandler{db: db}
}

func (ih *InvitationHandler) FindAllInvitations(w http.ResponseWriter, r *http.Request) {
	invitations, err := invitations.GetAllInvitationCode(r.Context(), ih.db, r.URL.Query().Get("serverID"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Invitations found", http.StatusOK, invitations)
}

func (ih *InvitationHandler) JoinServerByCode(w http.ResponseWriter, r *http.Request) {
	var p JoinServerWithCode

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := invitations.JoinServerWithInvitationCode(r.Context(), ih.db, p.Code, p.UserId)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Success join", http.StatusCreated, nil)
}

func (ih *InvitationHandler) CreateInvitationCode(w http.ResponseWriter, r *http.Request) {
	var p invitations.CreateInvitationType

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := invitations.CreateInvitationCode(r.Context(), ih.db, &p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	const msg = "invitation code created"
	httputil.EncodeResponse(w, msg, http.StatusCreated, &httputil.Response{
		Data:    res,
		Message: msg,
		Success: true,
	})
}
