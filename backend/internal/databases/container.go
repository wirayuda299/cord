package databases

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wirayuda299/backend/internal/queue"
)

const jobQueueBufferSize = 500

type Container struct {
	Postgres *pgxpool.Pool
	Jobs     *queue.Queue
}

func NewContainer(ctx context.Context) (*Container, error) {
	pool, err := NewPool(ctx)
	if err != nil {
		log.Println("PSQL ERROR -> ", err.Error())
		return nil, err
	}

	return &Container{
		Postgres: pool,
		Jobs:     queue.NewQueue(jobQueueBufferSize),
	}, nil
}

func (c *Container) Close() {
	c.Postgres.Close()
}
