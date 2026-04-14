package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/queue"
	"github.com/wirayuda299/backend/internal/services/channels"
	"github.com/wirayuda299/backend/internal/services/images"
	"github.com/wirayuda299/backend/internal/services/permissions"
)

func StartWorker(ctx context.Context, db *databases.Container) {
	log.Println("Starting worker...")
	for {
		res, err := db.Redis.BRPop(ctx, 5*time.Second, "jobs").Result()
		if err == redis.Nil {
			continue
		}
		if err != nil {
			log.Println("Error getting job from redis:", err)
			continue
		}

		var job queue.Job
		if err := json.Unmarshal([]byte(res[1]), &job); err != nil {
			log.Printf("Error unmarshalling job: %s", err)
			continue
		}

		if job.MaxRetry == 0 {
			job.MaxRetry = 3
		}

		log.Printf("📥 Got job: %s", job.Type)

		if err := handleJob(ctx, db, job); err != nil {
			log.Printf("❌ Error handling job: %s", err)
			job.Attempts++

			if job.Attempts < job.MaxRetry {
				delay := time.Duration(job.Attempts) * 5 * time.Second
				time.Sleep(delay)
				data, err := json.Marshal(job)
				if err != nil {
					log.Printf("❌ Failed to marshal job %s for retry: %v", job.Type, err)
					continue
				}

				db.Redis.LPush(ctx, queue.JobsQueue, data)
				log.Printf("🔁 Retrying job %s (attempt %d/%d)", job.Type, job.Attempts, job.MaxRetry)
				continue
			}

			// max retries exceeded — move to dead letter queue
			data, err := json.Marshal(job)
			if err != nil {
				log.Printf("❌ Failed to marshal job %s for dead letter: %v", job.Type, err)
				continue
			}
			db.Redis.LPush(ctx, queue.DeadLetterQueue, data)
			log.Printf("💀 Job %s moved to dead letter queue", job.Type)
			continue
		}

		log.Printf("✅ Job %s completed successfully", job.Type)
	}
}

func handleJob(ctx context.Context, db *databases.Container, job queue.Job) error {
	switch job.Type {

	case queue.UpdateRolePermission:

		log.Println("📦 Raw payload:", string(job.Payload))
		var p queue.UpdateRolePermissionPayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			log.Println(err.Error())
			return fmt.Errorf("failed to unmarshal payload: %s", err.Error())
		}

		err := permissions.UpdatePermission(ctx, db, &p)
		if err != nil {
			return fmt.Errorf("Error update permission :%s", err.Err.Error())
		}
		return nil
	case queue.CreateChannel:
		log.Println("📦 Raw payload:", string(job.Payload))
		var p queue.CreateChannelPayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			log.Println(err.Error())
			return fmt.Errorf("failed to unmarshal payload: %s", err.Error())
		}

		err := channels.CreateDefaultChannel(ctx, db, p)
		if err != nil {
			return fmt.Errorf("Error create channel :%w", err)
		}
		log.Println("Channel created")
		return nil

	case queue.DeleteImage:

		log.Println("📦 Raw payload delete image:", string(job.Payload))
		var p queue.DeleteImagePayload

		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return err
		}

		if err := images.DeleteImage(ctx, p.PublicID); err != nil {
			return err.Err
		}

		return nil

	default:
		log.Printf("Unknown job type: %s", job.Type)
		return fmt.Errorf("unknown job type: %s", job.Type)

	}
}
