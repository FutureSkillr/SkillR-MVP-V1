package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/FutureSkillr/MVP72/backend/internal/firebase"
)

type contextKey string

const UserInfoKey contextKey = "userInfo"

func FirebaseAuth(fbClient *firebase.Client) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization format")
			}

			token := parts[1]
			userInfo, err := fbClient.VerifyToken(c.Request().Context(), token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
			}

			// Store user info in context
			ctx := context.WithValue(c.Request().Context(), UserInfoKey, userInfo)
			c.SetRequest(c.Request().WithContext(ctx))

			return next(c)
		}
	}
}

func RequireAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userInfo := GetUserInfo(c)
			if userInfo == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
			}
			if userInfo.Role != "admin" {
				return echo.NewHTTPError(http.StatusForbidden, "admin role required")
			}
			return next(c)
		}
	}
}

// OptionalFirebaseAuth sets user info if a valid Bearer token is present,
// but does not block unauthenticated requests. Used for public AI routes
// where auth is optional (e.g., intro flow before user registration).
func OptionalFirebaseAuth(fbClient *firebase.Client) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return next(c)
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				return next(c)
			}
			userInfo, err := fbClient.VerifyToken(c.Request().Context(), parts[1])
			if err != nil {
				return next(c)
			}
			ctx := context.WithValue(c.Request().Context(), UserInfoKey, userInfo)
			c.SetRequest(c.Request().WithContext(ctx))
			return next(c)
		}
	}
}

func GetUserInfo(c echo.Context) *firebase.UserInfo {
	info, ok := c.Request().Context().Value(UserInfoKey).(*firebase.UserInfo)
	if !ok {
		return nil
	}
	return info
}

// SetTestUserInfo stores user info in the request context.
// This is intended for use in test code only — it bypasses authentication.
// M11: Retained as exported for cross-package test use; not called from any handler.
func SetTestUserInfo(c echo.Context, info *firebase.UserInfo) {
	ctx := context.WithValue(c.Request().Context(), UserInfoKey, info)
	c.SetRequest(c.Request().WithContext(ctx))
}

