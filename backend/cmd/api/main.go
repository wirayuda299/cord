package main

import (
	"context"

	"github.com/wirayuda299/backend/internal/config"
	"github.com/wirayuda299/backend/internal/databases"
)

func main() {
	if err := config.LoadEnv(); err != nil {
		panic(err)
	}

	ctx := context.Background()
	container, err := databases.NewContainer(ctx)
	if err != nil {
		panic(err)
	}

	defer container.Close()

	srv := config.NewServer(container)
	srv.Run()
}
