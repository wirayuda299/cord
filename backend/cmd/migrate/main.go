// Command migrate applies pending goose migrations from
// internal/migrations to DATABASE_URL. Run it before starting the API/build
// step, both locally (via run.sh) and on deploy.
package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/pressly/goose/v3"
	"github.com/wirayuda299/backend/internal/migrations"
)

func main() {
	_ = godotenv.Load() // fine if absent — deploy envs set DATABASE_URL directly

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("opening database: %v", err)
	}
	defer db.Close()

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		log.Fatalf("setting dialect: %v", err)
	}

	if err := goose.Up(db, "."); err != nil {
		log.Fatalf("running migrations: %v", err)
	}

	log.Println("migrations applied")
}
