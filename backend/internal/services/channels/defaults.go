package channels

import (
	"context"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/queue"
)

// type ChannelPayload struct {
// 	ServerId  string `json:"server_id"`
// 	CreatedBy string `json:"created_by"`
// }

func CreateDefaultChannel(ctx context.Context, db *databases.Container, payload queue.CreateChannelPayload) error {
	categories := []struct {
		name        string
		channelType string
	}{
		{"text channels", "text"},
		{"audio channels", "audio"},
	}
	for _, c := range categories {
		var id string
		err := db.Postgres.QueryRow(ctx, "INSERT INTO category (name,server_id,created_by) values($1,$2,$3) returning id;", c.name, payload.ServerId, payload.CreatedBy).Scan(&id)
		if err != nil {
			return err
		}

		if _, err := db.Postgres.Exec(ctx, "INSERT INTO channels(name,channel_type,category_id,created_by,server_id) values($1,$2,$3,$4,$5)", "general", c.channelType, id, payload.CreatedBy, payload.ServerId); err != nil {
			return err
		}
	}
	return nil
}
