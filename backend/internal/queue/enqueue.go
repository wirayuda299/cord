package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
)

// this function only have task to push job to queue, no need to check if job is already in queue
func PushJob(ctx context.Context, q *Queue, jobtype string, payload any) error {

	data, err := json.Marshal(payload)

	if err != nil {
		return err
	}

	// wrap the job in a struct
	job := Job{
		Type:    jobtype,
		Payload: json.RawMessage(data),
	}

	// Non-blocking: the queue is a bounded, in-process channel drained by a
	// single worker. Blocking here (as this used to do, waiting on ctx.Done()
	// as the only way out) turns a stalled worker or a burst of jobs into
	// hung HTTP requests instead of a clear, immediate failure the caller
	// can retry.
	select {
	case q.Jobs <- job:
		log.Printf("📤 Job pushed: %s", jobtype)
		return nil
	case <-ctx.Done():
		return ctx.Err()
	default:
		return fmt.Errorf("job queue is full, dropping %s job", jobtype)
	}
}
