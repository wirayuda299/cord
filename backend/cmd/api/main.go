package main

import (
	"context"
	"log"
	"os"
	"sync"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/wirayuda299/backend/internal"
	"github.com/wirayuda299/backend/internal/config"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/worker"
)

func main() {
	if err := config.LoadEnv(); err != nil {
		panic(err)
	}

	clerk.SetKey(os.Getenv("CLERK_SECRET_KEY"))

	ctx := context.Background()

	container, err := databases.NewContainer(ctx)
	if err != nil {
		log.Println("Failed to init databases", err.Error())

		panic(err)
	}

	defer container.Close()

	// Free-tier hosting only gives us one always-on service, so the queue
	// worker rides along in the API process instead of its own deployment.
	workerCtx, stopWorkers := context.WithCancel(ctx)
	var wg sync.WaitGroup
	for range 5 {
		wg.Go(func() {
			worker.StartWorker(workerCtx, container)
		})
	}

	srv := internal.NewServer(container)
	srv.Run() // blocks until the HTTP server has gracefully shut down

	stopWorkers()
	wg.Wait()
}
