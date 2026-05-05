package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/conversations"
)

type ConversationHandler struct {
	db *databases.Container
}

func NewConversationHandler(db *databases.Container) *ConversationHandler {
	return &ConversationHandler{db: db}
}

func (ch *ConversationHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {

	var p conversations.CreateConversationPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := conversations.CreateConversation(r.Context(), ch.db, p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Conversation created", http.StatusOK, nil)
}
