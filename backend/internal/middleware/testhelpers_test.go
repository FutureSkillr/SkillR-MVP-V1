package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"

	"github.com/labstack/echo/v4"

	"skillr-mvp-v1/backend/internal/firebase"
	"skillr-mvp-v1/backend/internal/middleware"
)

// SetTestUserInfo stores user info in the request context for testing.
// M11: Moved from production code to test-only file.
func SetTestUserInfo(c echo.Context, info *firebase.UserInfo) {
	ctx := context.WithValue(c.Request().Context(), middleware.UserInfoKey, info)
	c.SetRequest(c.Request().WithContext(ctx))
}

// NewTestContext creates an Echo context with a test user for handler tests.
func NewTestContext(e *echo.Echo, method, path string, userInfo *firebase.UserInfo) echo.Context {
	req := httptest.NewRequest(method, path, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	if userInfo != nil {
		SetTestUserInfo(c, userInfo)
	}
	return c
}

// Ensure imports are used
var _ = http.MethodGet
