package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/channels"
)

type ChannelHandler struct {
	db *databases.Container
}

func NewChannelHandler(db *databases.Container) *ChannelHandler {
	return &ChannelHandler{db}
}

func (ch *ChannelHandler) CreateChannel(w http.ResponseWriter, r *http.Request) {
	var p channels.CreateChannelPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := channels.CreateChannel(r.Context(), ch.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Channel created", http.StatusCreated, nil)
}

func (ch *ChannelHandler) FindAllChannelsInAServer(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")
	if serverID == "" {
		httputil.WriteErrorResponse(w, "Server ID is required", http.StatusBadRequest)
		return
	}

	grouped, err := channels.FindAllChannelInServer(r.Context(), ch.db, serverID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
	}
	httputil.EncodeResponse(w, "Channels found", http.StatusOK, grouped)
}

func (ch *ChannelHandler) GetChannelById(w http.ResponseWriter, r *http.Request) {
	channelId := r.URL.Query().Get("channelId")
	if channelId == "" {
		httputil.WriteErrorResponse(w, "Channel ID is required", http.StatusBadRequest)
		return
	}
	channel, err := channels.GetChannelById(r.Context(), ch.db, channelId)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Channel found", http.StatusOK, &channel)
}
