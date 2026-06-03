package utils

import (
	"context"
	"errors"

	"github.com/clerk/clerk-sdk-go/v2"
)

func GetSession(ctx context.Context) (string, error) {
	claims, _ := clerk.SessionClaimsFromContext(ctx)

	if claims == nil {
		return "", errors.New("unauthorized")
	}

	userID := claims.Subject
	return userID, nil
}
