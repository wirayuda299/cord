package databases

import (
	"context"
	"fmt"
	"log"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wirayuda299/backend/internal/config"
	"github.com/wirayuda299/backend/internal/queue"
)

const jobQueueBufferSize = 500

// Container is the app's shared-infrastructure bag: one Postgres pool, one
// job queue, the validated config, and one Cloudinary client, built once at
// startup and passed to whatever handler/service/worker needs them instead
// of each rebuilding its own from env vars per call.
type Container struct {
	Postgres   *pgxpool.Pool
	Jobs       *queue.Queue
	Config     *config.Config
	Cloudinary *cloudinary.Cloudinary
}

func NewContainer(ctx context.Context, cfg *config.Config) (*Container, error) {
	pool, err := NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Println("PSQL ERROR -> ", err.Error())
		return nil, err
	}

	cld, err := cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	if err != nil {
		return nil, fmt.Errorf("initializing cloudinary client: %w", err)
	}

	return &Container{
		Postgres:   pool,
		Jobs:       queue.NewQueue(jobQueueBufferSize),
		Config:     cfg,
		Cloudinary: cld,
	}, nil
}

func (c *Container) Close() {
	c.Postgres.Close()
}
