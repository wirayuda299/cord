package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/channels"
	"github.com/wirayuda299/backend/internal/services/members"
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

	joined, errRes := members.IsUserJoinedServer(r.Context(), ch.db, serverID)
	if errRes != nil {
		httputil.WriteErrorResponse(w, errRes.Err.Error(), errRes.Code)
		return
	}
	if !joined {
		httputil.WriteErrorResponse(w, "forbidden: you are not a member of this server", http.StatusForbidden)
		return
	}

	grouped, err := channels.FindAllChannelInServer(r.Context(), ch.db, serverID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Channels found", http.StatusOK, grouped)
}

func (ch *ChannelHandler) GetChannelByID(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channelId")
	if channelID == "" {
		httputil.WriteErrorResponse(w, "Channel ID is required", http.StatusBadRequest)
		return
	}
	channel, err := channels.GetChannelById(r.Context(), ch.db, channelID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}
	httputil.EncodeResponse(w, "Channel found", http.StatusOK, &channel)
}

func (ch *ChannelHandler) UpdateChannel(w http.ResponseWriter, r *http.Request) {
	var p channels.UpdateChannelPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := channels.UpdateChannel(r.Context(), ch.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Channel updated", http.StatusOK, nil)
}

func (ch *ChannelHandler) DeleteChannel(w http.ResponseWriter, r *http.Request) {
	var p channels.DeleteChannelPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := channels.DeleteChannel(r.Context(), ch.db, &p); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Channel deleted", http.StatusOK, nil)
}
