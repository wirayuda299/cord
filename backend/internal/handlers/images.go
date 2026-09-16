package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wirayuda299/backend/internal/databases"
	"github.com/wirayuda299/backend/internal/httputil"
	"github.com/wirayuda299/backend/internal/services/images"
	"github.com/wirayuda299/backend/internal/utils"
)

type ImageHandler struct {
	db *databases.Container
}

func NewImageHandler(db *databases.Container) *ImageHandler {
	return &ImageHandler{db: db}
}

func (ih *ImageHandler) DeleteImage(w http.ResponseWriter, r *http.Request) {
	if _, err := utils.GetSession(r.Context()); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusUnauthorized)
		return
	}

	var id string
	if err := json.NewDecoder(r.Body).Decode(&id); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := images.DeleteImage(r.Context(), ih.db.Cloudinary, id); err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Image deleted", http.StatusOK, nil)
}

func (ih *ImageHandler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		httputil.WriteErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	res, err := images.HandleUpload(&images.UploadImagePayload{
		Attachment: r.MultipartForm.File["attachment"],
		Ctx:        r.Context(),
		Cld:        ih.db.Cloudinary,
	})
	if err != nil {
		httputil.WriteErrorResponse(w, err.Err.Error(), err.Code)
		return
	}

	httputil.EncodeResponse(w, "Image uploaded", http.StatusCreated, res)
}
