package databases

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type redisConfig struct {
	addr         string
	password     string
	db           int
	poolSize     int
	minIdleConns int
	dialTimeout  time.Duration
	readTimeout  time.Duration
	writeTimeout time.Duration
}

func newRedisConfig() (*redisConfig, error) {
	addr := os.Getenv("REDIS_URL")
	if addr == "" {
		return nil, fmt.Errorf("REDIS_URL is not set")
	}
	return &redisConfig{
		addr:         addr,
		password:     os.Getenv("REDIS_PASSWORD"), // empty string is fine if no auth
		db:           0,
		poolSize:     10,
		minIdleConns: 2,
		dialTimeout:  5 * time.Second,
		readTimeout:  3 * time.Second,
		writeTimeout: 3 * time.Second,
	}, nil
}

func (cfg *redisConfig) buildOptions() *redis.Options {
	return &redis.Options{
		Addr:         cfg.addr,
		Password:     cfg.password,
		DB:           cfg.db,
		PoolSize:     cfg.poolSize,
		MinIdleConns: cfg.minIdleConns,
		DialTimeout:  cfg.dialTimeout,
		ReadTimeout:  cfg.readTimeout,
		WriteTimeout: cfg.writeTimeout,
	}
}

func NewRedisClient(ctx context.Context) (*redis.Client, error) {
	cfg, err := newRedisConfig()
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(cfg.buildOptions())

	if err := client.Ping(ctx).Err(); err != nil {
		err := client.Close()
		if err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("pinging redis: %w", err)
	}

	return client, nil
}
