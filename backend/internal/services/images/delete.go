package images

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/wirayuda299/backend/internal/httputil"
)

func DeleteImage(ctx context.Context, id string) *httputil.ErrorResponse {
	if id == "" {
		return &httputil.ErrorResponse{
			Err:  errors.New("image ID is missing"),
			Code: http.StatusBadRequest,
		}
	}

	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		fmt.Println("Error init cld ", err)
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	_, err = cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     id,
		ResourceType: "image",
	})
	if err != nil {
		fmt.Println("Error delete image ", err)
		return &httputil.ErrorResponse{
			Err:  err,
			Code: http.StatusInternalServerError,
		}
	}

	return nil
}
