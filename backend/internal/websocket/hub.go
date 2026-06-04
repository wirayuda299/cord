package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/wirayuda299/backend/internal/services"
)

type BroadcastPayload struct {
	ServerId  string                `json:"server_id"`
	ChannelId string                `json:"channel_id"`
	Messages  []services.MessageRow `json:"messages"`
}

type UserStatusPayload struct {
	Type     string `json:"type"`
	ServerId string `json:"server_id"`
	UserId   string `json:"user_id"`
	Action   string `json:"action"`
}

type UserListPayload struct {
	Type     string   `json:"type"`
	ServerId string   `json:"server_id"`
	UserIds  []string `json:"user_ids"`
}

// hub is brain of the application that handles all the connections and messages
// between the client and the server
type Hub struct {
	// Registered clients.
	clients map[string]map[string]map[*Client]bool
	mu      sync.RWMutex

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
			h.mu.Lock()
			userAlreadyConnected := false
			if servers, ok := h.clients[client.ServerID]; ok {
				for _, channels := range servers {
					for c := range channels {
						if c.UserID == client.UserID {
							userAlreadyConnected = true
							break
						}
					}
					if userAlreadyConnected {
						break
					}
				}
			}

			if h.clients[client.ServerID] == nil {
				h.clients[client.ServerID] = make(map[string]map[*Client]bool)
			}
			if h.clients[client.ServerID][client.ChannelID] == nil {
				h.clients[client.ServerID][client.ChannelID] = make(map[*Client]bool)
			}
			h.clients[client.ServerID][client.ChannelID][client] = true
			h.mu.Unlock()

			if !userAlreadyConnected {
				h.BroadcastUserStatus(client.ServerID, client.UserID, "connected")
			}
			// send current online user list to the newly connected client
			h.SendUserListToClient(client.ServerID, client)

		case client := <-h.unregister:
			h.mu.Lock()
			if servers, ok := h.clients[client.ServerID]; ok {
				if channels, ok := servers[client.ChannelID]; ok {
					if _, exists := channels[client]; exists {
						delete(channels, client)
						close(client.send)
						if len(channels) == 0 {
							delete(servers, client.ChannelID)
						}
						if len(servers) == 0 {
							delete(h.clients, client.ServerID)
						}
					}
				}
			}

			userStillConnected := false
			if servers, ok := h.clients[client.ServerID]; ok {
				for _, channels := range servers {
					for c := range channels {
						if c.UserID == client.UserID {
							userStillConnected = true
							break
						}
					}
					if userStillConnected {
						break
					}
				}
			}
			h.mu.Unlock()

			if !userStillConnected {
				h.BroadcastUserStatus(client.ServerID, client.UserID, "disconnected")
			}

		case message := <-h.broadcast:
			b, err := json.Marshal(message)
			if err != nil {
				log.Printf("broadcast: failed to marshal message: %v", err)
				continue
			}

			h.mu.Lock()
			servers := h.clients[message.ServerId]
			if servers != nil {
				if clients, ok := servers[message.ChannelId]; ok {
					for client := range clients {
						select {
						case client.send <- b:
						default:
							close(client.send)
							delete(clients, client)
						}
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

// SendUserListToClient sends a deduplicated list of connected user IDs for the given server
// to a single client (typically the client that just connected).
func (h *Hub) SendUserListToClient(serverId string, client *Client) {
	h.mu.RLock()
	servers := h.clients[serverId]
	userSet := make(map[string]bool)
	if h.clients[serverId] != nil {
		for _, clients := range servers {
			for c := range clients {
				if c.UserID != "" {
					userSet[c.UserID] = true
				}
			}
		}
	}
	h.mu.RUnlock()

	ids := make([]string, 0, len(userSet))
	for id := range userSet {
		ids = append(ids, id)
	}

	payload := UserListPayload{
		Type:     "user_list",
		ServerId: serverId,
		UserIds:  ids,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("SendUserListToClient: failed to marshal payload: %v", err)
		return
	}

	select {
	case client.send <- data:
	default:
		// Channel might be full/closed; defer cleanup to unregister
	}
}

func (h *Hub) BroadcastDelete(serverId, channelId, messageId string) {
	payload := DeletePayload{
		Type:      "message_deleted",
		Id:        messageId,
		ServerId:  serverId,
		ChannelId: channelId,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("BroadcastDelete: failed to marshal payload: %v", err)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	servers := h.clients[serverId]
	if servers != nil {
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

func (h *Hub) BroadcastUserStatus(serverId, userId, action string) {
	payload := UserStatusPayload{
		Type:     "user_status",
		ServerId: serverId,
		UserId:   userId,
		Action:   action,
	}
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("BroadcastUserStatus: failed to marshal payload: %v", err)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	servers := h.clients[serverId]
	if h.clients[serverId] != nil {
		for _, clients := range servers {
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

func (h *Hub) BroadcastMessages(serverId, channelId string, messages []services.MessageRow) {
	// Use the existing broadcast channel to reuse the Run loop logic
	h.broadcast <- BroadcastPayload{
		ServerId:  serverId,
		ChannelId: channelId,
		Messages:  messages,
	}
}
