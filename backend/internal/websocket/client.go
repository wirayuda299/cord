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
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error { c.Conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {

			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.ReplaceAll(message, newline, space))

		var m services.Message
		err = json.Unmarshal(message, &m)
		if err != nil {
			log.Println("error unmarshalling", err)
			continue
		}

		log.Println("Messages -> ", m)
		row, err := services.Send(c.ctx, m, db, c.channelID)
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
		c.Conn.Close()
	}()

	for {
		select {

		case message, ok := <-c.send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.send)
			for range n {
				w.Write(newline)
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
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
