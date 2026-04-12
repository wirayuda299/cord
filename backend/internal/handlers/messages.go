package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/messages"
	"github.com/wirayuda299/backend/internal/services/messages/pin"
)

type MessageHandler struct {
	db *databases.Container
}

func NewMessageHandler(db *databases.Container) *MessageHandler {
	return &MessageHandler{
		db: db,
	}
}

func (mh *MessageHandler) FindAllPinnedMessages(w http.ResponseWriter, r *http.Request) {
	channelId := r.URL.Query().Get("channelID")
	res, err := pin.GetAllPinnedMessage(r.Context(), mh.db, channelId)

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Pinned messages fetched successfully", http.StatusOK, res)

}

func (mh *MessageHandler) DeletePinnedMessage(w http.ResponseWriter, r *http.Request) {
	var id string
	err := json.NewDecoder(r.Body).Decode(&id)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	deleteErr := pin.DeletePinMessage(r.Context(), mh.db, id)
	if deleteErr != nil {
		httputil.WriteErrorResponse(w, deleteErr.Err.Error(), deleteErr.Code)
		return
	}

	httputil.EncodeResponse(w, "Message deleted", http.StatusCreated, nil)
}

func (mh *MessageHandler) PinMessage(w http.ResponseWriter, r *http.Request) {
	var p pin.PinMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("PinnedMessagePayload After scan -> %v", p)
	res := pin.PinMessage(r.Context(), mh.db, &p)
	if res != nil {
		httputil.WriteErrorResponse(w, res.Err.Error(), res.Code)
		return
	}

	httputil.EncodeResponse(w, "Message pinned", http.StatusCreated, nil)
}

func (mh *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	var p messages.DeleteMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := messages.DeleteMessage(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Message deleted", http.StatusCreated, nil)
}

func (mh *MessageHandler) FindAllMessages(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channelId")

	messages, err := messages.GetAllMessages(r.Context(), mh.db, channelID)

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "All messages fetched successfully", http.StatusOK, messages)

}
