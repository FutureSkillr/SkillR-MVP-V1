package middleware

import (
	"crypto/sha256"
	"fmt"
	"log"
	"time"

	"github.com/labstack/echo/v4"
)

// L5: Hash IP addresses in logs to avoid storing PII
func hashIP(ip string) string {
	h := sha256.Sum256([]byte(ip))
	return fmt.Sprintf("ip_%x", h[:4]) // first 4 bytes = 8 hex chars
}

func RequestLogger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			err := next(c)

			req := c.Request()
			res := c.Response()

			log.Printf("[%s] %s %s %d %s",
				req.Method,
				req.URL.Path,
				hashIP(c.RealIP()),
				res.Status,
				time.Since(start).Round(time.Millisecond),
			)

			return err
		}
	}
}
