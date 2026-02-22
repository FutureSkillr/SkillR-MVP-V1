package server

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
)

func RegisterStaticRoutes(e *echo.Echo, staticDir string) {
	// Serve static files from the built frontend
	if _, err := os.Stat(staticDir); err != nil {
		return // No static directory, skip
	}

	// Serve assets with cache headers (L8)
	assetsDir := filepath.Join(staticDir, "assets")
	if _, err := os.Stat(assetsDir); err == nil {
		e.Static("/assets", assetsDir)
	}

	// Serve landing pages
	landingDir := filepath.Join(staticDir, "landing")
	if _, err := os.Stat(landingDir); err == nil {
		e.Static("/landing", landingDir)
	}

	// L8: Cache-Control and security headers middleware for static files
	staticHeaders := func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			// Hashed assets get long cache; HTML/other files get short cache
			if strings.HasPrefix(path, "/assets/") {
				c.Response().Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				c.Response().Header().Set("Cache-Control", "public, max-age=300")
			}
			c.Response().Header().Set("X-Content-Type-Options", "nosniff")
			return next(c)
		}
	}

	// SPA fallback: serve index.html for all non-API, non-asset routes
	indexPath := filepath.Join(staticDir, "index.html")
	e.GET("/*", func(c echo.Context) error {
		path := c.Request().URL.Path

		// Don't intercept API routes
		if len(path) >= 4 && path[:4] == "/api" {
			return echo.NewHTTPError(http.StatusNotFound, "not found")
		}

		// H3: Path traversal protection — resolve and verify prefix
		filePath := filepath.Join(staticDir, filepath.Clean("/"+path))
		if !strings.HasPrefix(filePath, staticDir) {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			return c.File(filePath)
		}

		// SPA fallback
		return c.File(indexPath)
	}, staticHeaders)
}
