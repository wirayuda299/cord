package websocket

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gorilla/websocket"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/members"
	"github.com/wirayuda299/backend/internal/services/messages"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 65536
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: add origin check
		return true
	},
}

type Client struct {
	hub       *Hub
	Conn      *websocket.Conn
	send      chan []byte
	ServerID  string
	ChannelID string
	UserID    string
	// Username/Avatar are resolved once at handshake time so sending a
	// message doesn't need its own round trip to look them up.
	Username string
	Avatar   string
	ctx      context.Context
	cancel   context.CancelFunc
}

func (c *Client) ReadIncomingMessage(db *databases.Container) {
	defer func() {
		defer c.cancel()
		c.hub.unregister <- c
		err := c.Conn.Close()
		if err != nil {
			return
		}
	}()
	defer func() {
		if r := recover(); r != nil {
			log.Println("recovered panic in websocket handler:", r)
		}
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	if err := c.Conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		log.Printf("Error set read deadline -> %s", err)
	}
	c.Conn.SetPongHandler(func(string) error {
		err := c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		if err != nil {
			log.Println("error set pong handler -> ", err)
		}
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.ReplaceAll(message, newline, space))

		var m messages.Message
		err = json.Unmarshal(message, &m)
		if err != nil {
			log.Println("error unmarshalling", err)
			continue
		}

		log.Println("Server ID -> ", c.ServerID)
		row, err := messages.Send(c.ctx, m, db, c.ChannelID, c.ServerID, c.Username, c.Avatar)
		if err != nil {
			log.Println("error sending message", err.Error())
			continue
		}

		c.hub.broadcast <- BroadcastPayload{
			ServerId:  c.ServerID,
			ChannelId: c.ChannelID,
			Messages:  []services.MessageRow{*row},
		}
	}
}

// WriteMessage function only have task to send message to client
func (c *Client) WriteMessage() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		if err := c.Conn.Close(); err != nil {
			log.Printf("Error close connection -> %s", err)
		}
	}()
	defer func() {
		if r := recover(); r != nil {
			log.Println("recovered panic in websocket handler:", r)
		}
	}()

	for {
		select {

		case message, ok := <-c.send:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				log.Println("Error set write deadline -> ", err)
			}
			if !ok {
				if err := c.Conn.WriteMessage(websocket.CloseMessage, []byte{}); err != nil {
					log.Printf("Error write ws message -> %s", err)
				}
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, err = w.Write(message)
			if err != nil {
				log.Printf("Error write message -> %s", err)
			}

			n := len(c.send)
			for range n {
				if _, err := w.Write(newline); err != nil {
					log.Printf("Error w.Write -> %s", err)
				}
				if _, err := w.Write(<-c.send); err != nil {
					log.Printf("Error w.Write -> %s", err)
				}
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			if err := c.Conn.SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				log.Println("Error set write deadline -> ", err)
			}
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, db *databases.Container, w http.ResponseWriter, r *http.Request) {
	// WebSocket clients can't set custom headers, so the Clerk JWT is passed
	// as a query parameter: /ws?token=<clerk_session_token>&...
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "unauthorized: missing token", http.StatusUnauthorized)
		return
	}

	claims, err := jwt.Verify(r.Context(), &jwt.VerifyParams{Token: token})
	if err != nil {
		log.Printf("ws auth error: %v", err)
		http.Error(w, "unauthorized: invalid token", http.StatusUnauthorized)
		return
	}

	authCtx := clerk.ContextWithSessionClaims(r.Context(), claims)
	serverID := r.URL.Query().Get("serverId")
	channelID := r.URL.Query().Get("channelId")
	userID := claims.Subject

	if serverID != "" && serverID != "dm" {
		joined, memberErr := members.IsUserJoinedServer(authCtx, db, serverID)
		if memberErr != nil {
			log.Printf("ws auth error: fail to verify membership: %v", memberErr.Err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if !joined {
			log.Printf("ws auth error: user %s is not joined to server %s", userID, serverID)
			http.Error(w, "unauthorized: not a member of the server", http.StatusForbidden)
			return
		}
	} else if channelID != "" {
		var exists bool
		err = db.Postgres.QueryRow(authCtx, "SELECT EXISTS(SELECT 1 FROM channel_members WHERE channel_id = $1 AND user_id = $2)", channelID, userID).Scan(&exists)
		if err != nil {
			log.Printf("ws auth error: fail to verify channel membership: %v", err)
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		if !exists {
			log.Printf("ws auth error: user %s is not a member of DM channel %s", userID, channelID)
			http.Error(w, "unauthorized: not a member of the channel", http.StatusForbidden)
			return
		}
	}

	// Resolved once here instead of on every message send. Skipped for the
	// global presence bucket (channelID == "") since those connections
	// never send chat messages and vastly outnumber real chat ones.
	var username, avatar string
	if channelID != "" {
		_ = db.Postgres.QueryRow(authCtx, "SELECT username, COALESCE(avatar_url, '') FROM users WHERE id = $1", userID).Scan(&username, &avatar)
	}

	// Upgrade only after successful auth and validation
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}

	// Inject claims into context so utils.GetSession works inside ReadIncomingMessage.
	// Must be rooted at context.Background() — NOT r.Context() — because r.Context()
	// is canceled when the HTTP handler returns (right after the upgrade), which would
	// immediately cancel all DB calls in ReadIncomingMessage.
	ctx, cancel := context.WithCancel(clerk.ContextWithSessionClaims(context.Background(), claims))

	client := &Client{
		hub:       hub,
		Conn:      conn,
		send:      make(chan []byte, 256),
		ServerID:  serverID,
		ChannelID: channelID,
		UserID:    userID,
		Username:  username,
		Avatar:    avatar,
		ctx:       ctx,
		cancel:    cancel,
	}
	client.hub.register <- client

	go client.ReadIncomingMessage(db)
	go client.WriteMessage()
}
