package httputil

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
	Data    any    `json:"data"`
}

type ErrorResponse struct {
	Err  error
	Code int
}

func WriteResponse(
	w http.ResponseWriter,
	response Response,
	status int,
) {
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("failed to encode response: %v", err)
	}
}

func WriteErrorResponse(
	w http.ResponseWriter,
	message string,
	status int,
) {
	log.Printf("Error %d: %s", status, message)

	// 4xx messages are our own validation/authorization text and are safe
	// (and useful) to show the caller. 5xx messages are frequently a raw
	// pgx/DB error passed straight through by a service — those must never
	// reach the client (query text, constraint names, internal structure),
	// so the real message is logged above and a generic one is sent instead.
	clientMessage := message
	if status >= http.StatusInternalServerError {
		clientMessage = "internal server error"
	}

	WriteResponse(w, Response{
		Message: clientMessage,
		Success: false,
	}, status)
}

func EncodeResponse(
	w http.ResponseWriter,
	message string,
	status int,
	data any,
) {
	WriteResponse(w, Response{
		Message: message,
		Success: true,
		Data:    data,
	}, status)
}
