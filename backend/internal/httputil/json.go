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

	WriteResponse(w, Response{
		Message: message,
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
