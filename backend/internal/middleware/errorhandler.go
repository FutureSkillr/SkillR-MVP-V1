package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func JSONErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	code := http.StatusInternalServerError
	msg := "internal server error"

	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		if m, ok := he.Message.(string); ok {
			msg = m
		} else {
			msg = http.StatusText(code)
		}
	}

	// Never leak internal error details
	if code == http.StatusInternalServerError {
		msg = "internal server error"
	}

	_ = c.JSON(code, map[string]string{"error": msg})
}
