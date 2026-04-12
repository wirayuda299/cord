package queue

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
)

// this function only have task to push job to queue, no need to check if job is already in queue
func PushJob(ctx context.Context, rdb *redis.Client, jobtype string, payload any) error {

	data, err := json.Marshal(payload)

	if err != nil {
		return err
	}

	// wrap the job in a struct
	job := Job{
		Type:    jobtype,
		Payload: json.RawMessage(data),
	}
	jobData, err := json.Marshal(job)
	if err != nil {
		return err
	}

	// push the job to the queue
	err = rdb.LPush(ctx, "jobs", jobData).Err()
	if err != nil {
		return err
	}
	log.Printf("📤 Job pushed: %s", jobtype)
	return nil

}
