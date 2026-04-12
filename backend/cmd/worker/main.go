package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/wirayuda299/backend/internal/config"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/worker"
)

func main() {
	if err := config.LoadEnv(); err != nil {
		panic(err)
	}

	var ctx, cancel = context.WithCancel(context.Background())
	defer cancel()

	db, err := databases.NewContainer(ctx)

	if err != nil {
		panic(err)
	}

	defer db.Close()

	var wg sync.WaitGroup

	for range 5 {
		wg.Go(func() {
			worker.StartWorker(ctx, db)
		})

	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	<-quit
	log.Println("Shutting down...")

	cancel()
}
