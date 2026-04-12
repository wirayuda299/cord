package websocket

import (
	"encoding/json"
	"log"

	"github.com/wirayuda299/backend/internal/services"
)

type BroadcastPayload struct {
	ServerId  string                `json:"server_id"`
	ChannelId string                `json:"channel_id"`
	Messages  []services.MessageRow `json:"messages"`
}

// hub is brain of the application that handles all the connections and messages
// between the client and the server
type Hub struct {
	// Registered clients.
	clients map[string]map[string]map[*Client]bool

	// pesan masuk dari client ( browser )
	broadcast chan BroadcastPayload

	// client yang terhubung
	register chan *Client

	// client yang disconnected
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan BroadcastPayload),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]map[string]map[*Client]bool),
	}
}

type DeletePayload struct {
	Type      string `json:"type"`
	Id        string `json:"id"`
	ServerId  string `json:"server_id"`
	ChannelId string `json:"channel_id"`
}

// jika ada yg ngirim data register dari channel, simpen ke client variable
// jika ada yg mengirim data unregister dari channel, simpen ke client variable
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			if h.clients[client.ServerID] == nil {
				h.clients[client.ServerID] = make(map[string]map[*Client]bool)
			}
			if h.clients[client.ServerID][client.channelID] == nil {
				h.clients[client.ServerID][client.channelID] = make(map[*Client]bool)
			}
			h.clients[client.ServerID][client.channelID][client] = true

		case client := <-h.unregister:
			if servers, ok := h.clients[client.ServerID]; ok {
				if channels, ok := servers[client.channelID]; ok {
					if _, exists := channels[client]; exists {
						delete(channels, client)
						close(client.send)
						if len(channels) == 0 {
							delete(servers, client.channelID)
						}
						if len(servers) == 0 {
							delete(h.clients, client.ServerID)
						}
					}
				}
			}

		case message := <-h.broadcast:
			if servers, ok := h.clients[message.ServerId]; ok {

				log.Println("Servers -> ", servers)
				if clients, ok := servers[message.ChannelId]; ok {

					log.Println("Clients -> ", clients)
					for client := range clients {
						b, _ := json.Marshal(message)
						select {
						case client.send <- b:
						default:
							close(client.send)
							delete(clients, client)
						}
					}
				}
			}
		}
	}
}

func (h *Hub) BroadcastDelete(serverId, channelId, messageId string) {
	payload := DeletePayload{
		Type:      "message_deleted",
		Id:        messageId,
		ServerId:  serverId,
		ChannelId: channelId,
	}
	data, _ := json.Marshal(payload)

	if servers, ok := h.clients[serverId]; ok {
		if clients, ok := servers[channelId]; ok {
			for client := range clients {
				select {
				case client.send <- data:
				default:
					close(client.send)
					delete(clients, client)
				}
			}
		}
	}
}
