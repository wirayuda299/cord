package users

import "github.com/wirayuda299/backend/internal/databases"

type UserHandler struct {
	db *databases.Container
}

func NewUserHandler(db *databases.Container) *UserHandler {
	return &UserHandler{db: db}
}

func (uh *UserHandler) CreateUser() {}
