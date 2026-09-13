package queue

// Queue is an in-process job queue. Producers and the worker run in the same
// binary (see cmd/api/main.go), so jobs are handed off via a Go channel
// instead of a Redis list — the worker blocks on the channel for free
// instead of polling an external service.
type Queue struct {
	Jobs chan Job
}

func NewQueue(bufferSize int) *Queue {
	return &Queue{Jobs: make(chan Job, bufferSize)}
}
