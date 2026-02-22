package firebase

import (
	"context"
	"fmt"

	"firebase.google.com/go/v4/auth"
)

type UserInfo struct {
	UID         string
	Email       string
	DisplayName string
	PhotoURL    string
	Role        string // from custom claims
}

func (c *Client) VerifyToken(ctx context.Context, idToken string) (*UserInfo, error) {
	token, err := c.Auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, fmt.Errorf("verify token: %w", err)
	}

	info := &UserInfo{
		UID: token.UID,
	}

	// Extract claims
	if email, ok := token.Claims["email"].(string); ok {
		info.Email = email
	}
	if name, ok := token.Claims["name"].(string); ok {
		info.DisplayName = name
	}
	if photo, ok := token.Claims["picture"].(string); ok {
		info.PhotoURL = photo
	}
	if role, ok := token.Claims["role"].(string); ok && (role == "user" || role == "admin") {
		info.Role = role
	} else {
		info.Role = "user" // Default to user for unknown or missing roles
	}

	return info, nil
}

func (c *Client) SetAdminClaim(ctx context.Context, uid string) error {
	claims := map[string]interface{}{
		"role": "admin",
	}
	if err := c.Auth.SetCustomUserClaims(ctx, uid, claims); err != nil {
		return fmt.Errorf("set admin claim: %w", err)
	}
	return nil
}

// EnsureUser creates or gets the internal user record, returning their UUID.
// This is called after Firebase token verification to sync the user to PostgreSQL.
func (c *Client) GetFirebaseUser(ctx context.Context, uid string) (*auth.UserRecord, error) {
	user, err := c.Auth.GetUser(ctx, uid)
	if err != nil {
		return nil, fmt.Errorf("get firebase user: %w", err)
	}
	return user, nil
}
