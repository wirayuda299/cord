package channels

import (
	"context"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
)

type Category struct {
	Id        string `json:"category_id"`
	ServerId  string `json:"server_id"`
	CreatedBy string `json:"created_by"`
}

type ServerInfo struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Logo string `json:"logo"`
}

type Channel struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ChannelType string `json:"channel_type"`
	CategoryID  string `json:"category_id"`
	Topic       string `json:"topic"`
}

type CategoryWithChannels struct {
	Id       string    `json:"id"`
	Name     string    `json:"name"`
	Channels []Channel `json:"channels"`
}

type GroupedChannels struct {
	Server        ServerInfo             `json:"server"`
	Uncategorized []Channel              `json:"uncategorized"`
	Categories    []CategoryWithChannels `json:"categories"`
}

func FindAllChannelInServer(ctx context.Context, db *databases.Container, serverID string) (*GroupedChannels, *httputil.ErrorResponse) {
	result := &GroupedChannels{
		Uncategorized: []Channel{},
		Categories:    []CategoryWithChannels{},
	}

	// Query 1: server info
	err := db.Postgres.QueryRow(ctx, `
        SELECT id::text, name, COALESCE(logo, '') FROM servers WHERE id = $1
    `, serverID).Scan(&result.Server.Id, &result.Server.Name, &result.Server.Logo)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusNotFound}
	}

	// Query 2: all categories for this server (even empty ones)
	catRows, err := db.Postgres.Query(ctx, `
        SELECT id::text, name FROM category WHERE server_id = $1 ORDER BY name
    `, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer catRows.Close()

	categoryIndex := make(map[string]int)
	for catRows.Next() {
		var cat CategoryWithChannels
		if err := catRows.Scan(&cat.Id, &cat.Name); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}
		cat.Channels = []Channel{}
		categoryIndex[cat.Id] = len(result.Categories)
		result.Categories = append(result.Categories, cat)
	}
	if err := catRows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	// Query 3: all channels for this server
	chRows, err := db.Postgres.Query(ctx, `
        SELECT
            id::text,
            name,
            channel_type,
            COALESCE(category_id::text, '') AS category_id,
            COALESCE(topic, '')             AS topic
        FROM channels
        WHERE server_id = $1
        ORDER BY name
    `, serverID)
	if err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}
	defer chRows.Close()

	for chRows.Next() {
		var ch Channel
		if err := chRows.Scan(&ch.ID, &ch.Name, &ch.ChannelType, &ch.CategoryID, &ch.Topic); err != nil {
			return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
		}

		if ch.CategoryID == "" {
			result.Uncategorized = append(result.Uncategorized, ch)
			continue
		}

		idx, exists := categoryIndex[ch.CategoryID]
		if !exists {
			result.Uncategorized = append(result.Uncategorized, ch)
			continue
		}
		result.Categories[idx].Channels = append(result.Categories[idx].Channels, ch)
	}
	if err := chRows.Err(); err != nil {
		return nil, &httputil.ErrorResponse{Err: err, Code: http.StatusInternalServerError}
	}

	return result, nil
}
