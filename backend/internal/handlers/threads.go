package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/threads"
)

type ThreadHandler struct {
	db *databases.Container
}

func NewThreadHandler(db *databases.Container) *ThreadHandler {
	return &ThreadHandler{db: db}
}

func (th *ThreadHandler) FindThreadByID(w http.ResponseWriter, r *http.Request) {
	thread, err := threads.FindThreadByID(r.Context(), th.db, r.URL.Query().Get("thread_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "thread found", http.StatusOK, thread)
}

func (th *ThreadHandler) FindAllThreadMessages(w http.ResponseWriter, r *http.Request) {
	messages, err := threads.GetAllThreadMessages(r.Context(), th.db, r.URL.Query().Get("thread_id"))
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Messages found", http.StatusOK, messages)
}

func (th *ThreadHandler) CreateThread(w http.ResponseWriter, r *http.Request) {
	var p threads.CreateThreadPayload

	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}
	err := threads.CreateThread(r.Context(), th.db, &p)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "thread created", http.StatusCreated, nil)
}
