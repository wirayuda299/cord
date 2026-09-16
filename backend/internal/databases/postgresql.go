package databases

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type postgresConfig struct {
	address           string
	maxConns          int32
	minConns          int32
	maxConnIdleTime   time.Duration
	healthCheckPeriod time.Duration
}

func newPostgresConfig(databaseURL string) *postgresConfig {
	return &postgresConfig{
		address:           databaseURL,
		maxConns:          100,
		minConns:          2,
		maxConnIdleTime:   5 * time.Minute,
		healthCheckPeriod: time.Minute,
	}
}

func (cfg *postgresConfig) buildPoolConfig() (*pgxpool.Config, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.address) // handles full DSN or URL
	if err != nil {
		return nil, fmt.Errorf("parsing database config: %w", err)
	}

	poolCfg.MaxConns = cfg.maxConns
	poolCfg.MinConns = cfg.minConns
	poolCfg.MaxConnIdleTime = cfg.maxConnIdleTime
	poolCfg.HealthCheckPeriod = cfg.healthCheckPeriod

	return poolCfg, nil
}

func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	cfg := newPostgresConfig(databaseURL)

	poolCfg, err := cfg.buildPoolConfig()
	if err != nil {
		return nil, err
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("creating pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	return pool, nil
}
