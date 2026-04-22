package main

import (
	"context"
	"log"

	"github.com/wirayuda299/backend/internal"
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
		log.Println("Failed to init databases", err.Error())
		panic(err)
	}

	defer container.Close()

	srv := internal.NewServer(container)
	srv.Run()
}
