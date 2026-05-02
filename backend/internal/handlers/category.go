package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/categories"
)

type CategoryHandler struct {
	db *databases.Container
}

func NewCategoryHandler(db *databases.Container) *CategoryHandler {
	return &CategoryHandler{db: db}
}

func (ch *CategoryHandler) FindAllCategories(w http.ResponseWriter, r *http.Request) {
	serverID := r.URL.Query().Get("serverID")

	allCategories, err := categories.FindAllCategories(r.Context(), ch.db, serverID)
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "categories fetched successfully", http.StatusOK, allCategories)
}

func (ch *CategoryHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var payload categories.CreateCategoryPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.WriteErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := categories.CreateCategory(r.Context(), ch.db, &payload); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Category created successfully", http.StatusCreated, nil)
}
