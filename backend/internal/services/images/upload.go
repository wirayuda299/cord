// Package images
package images

import (
	"context"
	"errors"
	"mime/multipart"
	"net/http"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/wirayuda299/backend/internal/httputil"
)

type UploadResponse struct {
	PublicID string `json:"public_id"`
	URL      string `json:"url"`
}

type UploadImagePayload struct {
	Attachment []*multipart.FileHeader
	Ctx        context.Context
}

func HandleUpload(p *UploadImagePayload) (*UploadResponse, *httputil.ErrorResponse) {

	if len(p.Attachment) == 0 {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("no file uploaded"),
			Code: http.StatusBadRequest,
		}
	}

	header := p.Attachment[0]
	allowed := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
	if !allowed[header.Header.Get("Content-Type")] {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("only jpg, png, gif, webp allowed"),
			Code: http.StatusBadRequest,
		}
	}
	if header.Size > 1<<20 {
		return nil, &httputil.ErrorResponse{
			Err:  errors.New("File size 1mb exceed"),
			Code: http.StatusBadRequest,
		}
	}

	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	file, err := p.Attachment[0].Open()
	if err != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	defer file.Close()

	res, uploadErr := cld.Upload.Upload(p.Ctx, file, uploader.UploadParams{
		Folder:         "discord",
		Transformation: "c_fill,h_300,w_300",
		Format:         "jpeg",
	})
	if uploadErr != nil {
		return nil, &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}
	return &UploadResponse{
		PublicID: res.PublicID,
		URL:      res.SecureURL,
	}, nil
}
