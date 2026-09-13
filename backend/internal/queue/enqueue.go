package queue

import (
	"context"
	"encoding/json"
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

	select {
	case q.Jobs <- job:
		log.Printf("📤 Job pushed: %s", jobtype)
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
