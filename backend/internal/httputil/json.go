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

func WriteErrorResponse(w http.ResponseWriter, message string, status int) {
	w.WriteHeader(status)

	log.Printf("Error %d: %s", status, message)

	if err := json.NewEncoder(w).Encode(Response{
		Message: message,
		Success: false,
	}); err != nil {
		log.Println(err.Error())
	}
}

func EncodeResponse(w http.ResponseWriter, message string, status int, data any) {
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(Response{
		Message: message,
		Success: true,
		Data:    data,
	}); err != nil {
		WriteErrorResponse(w, err.Error(), http.StatusInternalServerError)
	}
}
