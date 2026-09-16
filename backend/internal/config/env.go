package config

import (
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"github.com/joho/godotenv"
)

// Config centralizes every environment-derived setting the backend needs.
// It's read and validated once at startup instead of via ad hoc os.Getenv
// calls scattered across packages — previously a missing variable (e.g. a
// blank CLERK_SECRET_KEY) failed silently and only surfaced as a confusing
// error deep inside a request, rather than at boot.
type Config struct {
	DatabaseURL         string
	ClerkSecretKey      string
	ClientURL           string
	InternalAPISecret   string
	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string
}

// Load reads .env (if present) and every required environment variable,
// failing fast with a clear error naming what's missing rather than letting
// the zero value (an empty string) silently propagate into, say, a Clerk or
// Cloudinary client that then fails unpredictably later.
func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		return nil, err
	}
	log.Println("✅ Successfully loaded .env file")

	cfg := &Config{
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		ClerkSecretKey:      os.Getenv("CLERK_SECRET_KEY"),
		ClientURL:           os.Getenv("CLIENT_URL"),
		InternalAPISecret:   os.Getenv("INTERNAL_API_SECRET"),
		CloudinaryCloudName: os.Getenv("CLOUDINARY_CLOUD_NAME"),
		CloudinaryAPIKey:    os.Getenv("CLOUDINARY_API_KEY"),
		CloudinaryAPISecret: os.Getenv("CLOUDINARY_API_SECRET"),
	}

	required := map[string]string{
		"DATABASE_URL":          cfg.DatabaseURL,
		"CLERK_SECRET_KEY":      cfg.ClerkSecretKey,
		"CLIENT_URL":            cfg.ClientURL,
		"INTERNAL_API_SECRET":   cfg.InternalAPISecret,
		"CLOUDINARY_CLOUD_NAME": cfg.CloudinaryCloudName,
		"CLOUDINARY_API_KEY":    cfg.CloudinaryAPIKey,
		"CLOUDINARY_API_SECRET": cfg.CloudinaryAPISecret,
	}
	var missing []string
	for name, val := range required {
		if val == "" {
			missing = append(missing, name)
		}
	}
	if len(missing) > 0 {
		sort.Strings(missing)
		return nil, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}
