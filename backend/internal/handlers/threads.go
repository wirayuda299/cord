package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/messages"
	"github.com/wirayuda299/backend/internal/services/threads"
)

type ThreadHandler struct {
	db  *databases.Container
	hub messages.BroadcastDeleter
}

func NewThreadHandler(db *databases.Container, hub messages.BroadcastDeleter) *ThreadHandler {
	return &ThreadHandler{db: db, hub: hub}
}

func (th *ThreadHandler) DeleteThread(w http.ResponseWriter, r *http.Request) {
	var p threads.DeleteThreadRequest

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	channelID, messageID, err := threads.DeleteThread(r.Context(), th.db, p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	// Fetch the updated message row to broadcast to other clients
	updatedMsg, getErr := messages.GetMessageByID(r.Context(), th.db, messageID, channelID)
	if getErr != nil {
		log.Println("failed to fetch updated message for broadcast:", getErr.Err)
	} else if th.hub != nil {
		serverID, sidErr := messages.GetServerIDByChannelID(r.Context(), th.db, channelID)
		if sidErr != nil {
			log.Println("failed to resolve server id for broadcast:", sidErr)
		} else {
			th.hub.BroadcastMessages(serverID, channelID, []services.MessageRow{*updatedMsg})
		}
	}

	httputil.EncodeResponse(w, "thread deleted", http.StatusOK, nil)
}

func (th *ThreadHandler) FindThreadByID(w http.ResponseWriter, r *http.Request) {
	thread, err := threads.FindThreadByID(r.Context(), th.db, r.URL.Query().Get("thread_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "thread found", http.StatusOK, thread)
}

func (th *ThreadHandler) FindAllThreadMessages(w http.ResponseWriter, r *http.Request) {
	messages, err := threads.GetAllThreadMessages(r.Context(), th.db, r.URL.Query().Get("thread_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Messages found", http.StatusOK, messages)
}

func (th *ThreadHandler) CreateThread(w http.ResponseWriter, r *http.Request) {
	var p threads.CreateThreadPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := threads.CreateThread(r.Context(), th.db, &p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	// Fetch the updated message row to broadcast to other clients
	updatedMsg, getErr := messages.GetMessageByID(r.Context(), th.db, p.MessageID, p.ChannelID)
	if getErr != nil {
		log.Println("failed to fetch updated message for broadcast:", getErr.Err)
	} else if th.hub != nil {
		serverID, sidErr := messages.GetServerIDByChannelID(r.Context(), th.db, p.ChannelID)
		if sidErr != nil {
			log.Println("failed to resolve server id for broadcast:", sidErr)
		} else {
			th.hub.BroadcastMessages(serverID, p.ChannelID, []services.MessageRow{*updatedMsg})
		}
	}

	httputil.EncodeResponse(w, "thread created", http.StatusCreated, nil)
}
