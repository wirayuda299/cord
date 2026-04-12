package databases

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Container struct {
	Postgres *pgxpool.Pool
	Redis    *redis.Client
}

func NewContainer(ctx context.Context) (*Container, error) {

	pool, err := NewPool(ctx)
	if err != nil {
		return nil, err
	}

	rdb, err := NewRedisClient(ctx)
	if err != nil {
		pool.Close()
		return nil, err
	}

	return &Container{
		Postgres: pool,
		Redis:    rdb,
	}, nil
}

func (c *Container) Close() {
	c.Postgres.Close()
	c.Redis.Close()
}
