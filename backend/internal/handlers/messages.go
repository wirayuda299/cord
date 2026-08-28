package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services"

	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/services/messages"
	"github.com/wirayuda299/backend/internal/services/messages/pin"
)

type MessageHandler struct {
	db  *databases.Container
	hub messages.BroadcastDeleter
}

func NewMessageHandler(db *databases.Container, hub messages.BroadcastDeleter) *MessageHandler {
	return &MessageHandler{
		db:  db,
		hub: hub,
	}
}

func (mh *MessageHandler) SearchMessage(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	serverID := r.URL.Query().Get("serverID")
	channelID := r.URL.Query().Get("channelID")
	msgs, err := messages.SearchMessage(r.Context(), mh.db, query, serverID, channelID)

	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "messages found", http.StatusOK, msgs)

}

func (mh *MessageHandler) FindAllPinnedMessages(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channelID")

	allowed, verifyErr := members.VerifyChannelAccess(r.Context(), mh.db, channelID)
	if verifyErr != nil {
		httputil.WriteErrorResponse(w, verifyErr.Error(), http.StatusInternalServerError)
		return
	}
	if !allowed {
		httputil.WriteErrorResponse(w, "forbidden: you do not have access to this channel", http.StatusForbidden)
		return
	}

	res, err := pin.GetAllPinnedMessage(r.Context(), channelID, mh.db)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Pinned messages fetched successfully", http.StatusOK, res)
}

func (mh *MessageHandler) DeletePinnedMessage(w http.ResponseWriter, r *http.Request) {
	var p pin.DeletePinMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	deleteErr := pin.DeletePinMessage(r.Context(), mh.db, p)
	if deleteErr != nil {
		httputil.WriteErrorResponse(w, deleteErr.Err.Error(), deleteErr.Code)
		return
	}

	httputil.EncodeResponse(w, "Message deleted", http.StatusOK, nil)
}

func (mh *MessageHandler) PinMessage(w http.ResponseWriter, r *http.Request) {
	var p pin.PinMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := pin.PinMessage(r.Context(), mh.db, &p)
	if res != nil {
		httputil.WriteErrorResponse(w, res.Err.Error(), res.Code)
		return
	}

	httputil.EncodeResponse(w, "Message pinned", http.StatusCreated, nil)
}

func (mh *MessageHandler) EditMessage(w http.ResponseWriter, r *http.Request) {
	var p messages.EditMessagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := messages.EditMessage(r.Context(), mh.db, &p)
	if res != nil {
		httputil.WriteErrorResponse(w, res.Err.Error(), res.Code)
		return
	}

	// Fetch the updated message row to broadcast to other clients
	updatedMsg, getErr := messages.GetMessageByID(r.Context(), mh.db, p.ID, p.ChannelID)
	if getErr != nil {
		log.Println("failed to fetch updated message for broadcast:", getErr.Err)
	} else if mh.hub != nil {
		serverID, sidErr := messages.GetServerIDByChannelID(r.Context(), mh.db, p.ChannelID)
		if sidErr != nil {
			log.Println("failed to resolve server id for broadcast:", sidErr)
		} else {
			mh.hub.BroadcastMessages(serverID, p.ChannelID, []services.MessageRow{*updatedMsg})
		}
	}

	httputil.EncodeResponse(w, "Message edited", http.StatusOK, nil)
}

func (mh *MessageHandler) AddReaction(w http.ResponseWriter, r *http.Request) {
	var p messages.ReactionPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := messages.AddReaction(r.Context(), mh.db, &p)
	if res != nil {
		httputil.WriteErrorResponse(w, res.Err.Error(), res.Code)
		return
	}

	httputil.EncodeResponse(w, "Reaction added", http.StatusOK, nil)
}

func (mh *MessageHandler) RemoveReaction(w http.ResponseWriter, r *http.Request) {
	var p messages.ReactionPayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := messages.RemoveReaction(r.Context(), mh.db, &p)
	if res != nil {
		httputil.WriteErrorResponse(w, res.Err.Error(), res.Code)
		return
	}

	httputil.EncodeResponse(w, "Reaction removed", http.StatusOK, nil)
}

func (mh *MessageHandler) DeleteMessage(w http.ResponseWriter, r *http.Request) {
	var p queue.DeleteImagePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := messages.DeleteMessage(&messages.DeleteMessagePayload{
		Ctx:              r.Context(),
		Hub:              mh.hub,
		DB:               mh.db,
		DeleteImgPayload: p,
	}); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Message deleted", http.StatusOK, nil)
}

func (mh *MessageHandler) FindAllMessages(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channelId")

	allowed, verifyErr := members.VerifyChannelAccess(r.Context(), mh.db, channelID)
	if verifyErr != nil {
		httputil.WriteErrorResponse(w, verifyErr.Error(), http.StatusInternalServerError)
		return
	}
	if !allowed {
		httputil.WriteErrorResponse(w, "forbidden: you do not have access to this channel", http.StatusForbidden)
		return
	}

	allMessages, err := messages.GetAllMessages(r.Context(), mh.db, channelID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "All messages fetched successfully", http.StatusOK, allMessages)
}
