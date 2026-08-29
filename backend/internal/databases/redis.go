package databases

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	poolSize     = 10
	minIdleConns = 2
	dialTimeout  = 5 * time.Second
	readTimeout  = 3 * time.Second
	writeTimeout = 3 * time.Second
)

// buildRedisOptions accepts either a full connection URL
// (redis://... or rediss://user:pass@host:port, e.g. Upstash) or a bare
// host:port for local dev without auth/TLS.
func buildRedisOptions(raw string) (*redis.Options, error) {
	if raw == "" {
		return nil, fmt.Errorf("REDIS_URL is not set")
	}

	var opts *redis.Options
	if strings.Contains(raw, "://") {
		parsed, err := redis.ParseURL(raw)
		if err != nil {
			return nil, fmt.Errorf("parsing REDIS_URL: %w", err)
		}
		opts = parsed
	} else {
		opts = &redis.Options{
			Addr:     raw,
			Password: os.Getenv("REDIS_PASSWORD"), // empty string is fine if no auth
			DB:       0,
		}
	}

	opts.PoolSize = poolSize
	opts.MinIdleConns = minIdleConns
	opts.DialTimeout = dialTimeout
	opts.ReadTimeout = readTimeout
	opts.WriteTimeout = writeTimeout

	return opts, nil
}

func NewRedisClient(ctx context.Context) (*redis.Client, error) {
	opts, err := buildRedisOptions(os.Getenv("REDIS_URL"))
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opts)

	if err := client.Ping(ctx).Err(); err != nil {
		err := client.Close()
		if err != nil {
			return nil, err
		}
		return nil, fmt.Errorf("pinging redis: %w", err)
	}

	return client, nil
}
