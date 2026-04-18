package websocket

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/services"
	"github.com/wirayuda299/backend/internal/services/messages"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
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
	channelID string
	ctx       context.Context
	cancel    context.CancelFunc
}

func (c *Client) ReadIncomingMessage(db *databases.Container) {
	defer func() {
		defer c.cancel()
		c.hub.unregister <- c
		c.Conn.Close()
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

		log.Println("Messages -> ", m)
		row, err := messages.Send(c.ctx, m, db, c.channelID)
		if err != nil {
			log.Println("error sending message", err.Error())
			continue
		}

		c.hub.broadcast <- BroadcastPayload{
			ServerId:  c.ServerID,
			ChannelId: c.channelID,
			Messages:  []services.MessageRow{*row},
		}
	}
}

// function that only have task to send message to client
func (c *Client) WriteMessage() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		if err := c.Conn.Close(); err != nil {
			log.Printf("Error close connection -> %s", err)
		}
	}()

	for {
		select {

		case message, ok := <-c.send:
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
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}

	ctx, cancel := context.WithCancel(context.Background())
	serverID := r.URL.Query().Get("serverId")
	channelID := r.URL.Query().Get("channelId")

	client := &Client{
		hub:       hub,
		Conn:      conn,
		send:      make(chan []byte, 256),
		ServerID:  serverID,
		ctx:       ctx,
		cancel:    cancel,
		channelID: channelID,
	}
	client.hub.register <- client

	go client.ReadIncomingMessage(db)
	go client.WriteMessage()
}
