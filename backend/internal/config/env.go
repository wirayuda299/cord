package config

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnv() error {
	if err := godotenv.Load(); err != nil {
		return err
	}
	log.Println("✅ Successfully loaded .env file")
	return nil
}
