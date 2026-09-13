package worker

import (
	"context"
	"testing"
	"time"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/queue"
)

// Exercises the in-process queue/worker wiring end to end: pushing a job
// hands it to the worker over the channel (no external broker involved),
// a failing handler enters its retry backoff instead of crashing, and
// cancelling the context interrupts that backoff for a clean shutdown.
func TestStartWorker_HandlesJobAndShutsDownCleanly(t *testing.T) {
	db := &databases.Container{Jobs: queue.NewQueue(10)}

	ctx, cancel := context.WithCancel(context.Background())

	done := make(chan struct{})
	go func() {
		StartWorker(ctx, db)
		close(done)
	}()

	// Unknown job type fails instantly with no DB/Cloudinary/Clerk
	// dependency, which is enough to prove the channel handoff and the
	// error/retry path run without panicking.
	if err := queue.PushJob(ctx, db.Jobs, "unknown_type_for_test", map[string]string{"x": "y"}); err != nil {
		t.Fatalf("PushJob failed: %v", err)
	}

	// Give the worker time to dequeue the job, fail it, and enter its
	// retry backoff sleep before we cancel.
	time.Sleep(100 * time.Millisecond)

	cancel()

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("worker did not shut down after context cancellation (possible deadlock in retry backoff)")
	}
}

func TestPushJob_RespectsContextCancellation(t *testing.T) {
	q := queue.NewQueue(0) // unbuffered: send only succeeds if something is receiving

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := queue.PushJob(ctx, q, "unknown_type_for_test", nil)
	if err == nil {
		t.Fatal("expected PushJob to fail fast on an already-cancelled context, got nil error")
	}
}
