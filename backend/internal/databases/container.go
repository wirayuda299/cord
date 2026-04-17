package databases

import (
	"context"
	"log"

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
		log.Println("PSQL ERROR -> ", err.Error())
		return nil, err
	}

	rdb, err := NewRedisClient(ctx)
	if err != nil {

		log.Println("REDIS ERROR -> ", err.Error())
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
