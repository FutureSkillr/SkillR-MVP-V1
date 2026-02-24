package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"

	"skillr-mvp-v1/backend/internal/config"
)

type Server struct {
	Echo   *echo.Echo
	Config *config.Config
}

func New(cfg *config.Config) *Server {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	// M15: Configure IP extractor to use X-Forwarded-For from trusted proxy (Cloud Run)
	e.IPExtractor = echo.ExtractIPFromXFFHeader()

	// Global middleware
	e.Use(echomw.Recover())
	e.Use(echomw.RequestID())

	// L9: Validate that wildcard origin is not used with AllowCredentials
	corsOrigins := cfg.AllowedOrigins
	allowCreds := true
	for _, o := range corsOrigins {
		if o == "*" {
			allowCreds = false
			break
		}
	}

	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins:     corsOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowCredentials: allowCreds,
		MaxAge:           3600,
	}))
	// Conditional body limit: 500M for LFS uploads, 10M for everything else (FR-131)
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		lfsLimit := echomw.BodyLimit("500M")
		defaultLimit := echomw.BodyLimit("10M")
		return func(c echo.Context) error {
			if c.Path() == "/api/lfs/produce" {
				return lfsLimit(next)(c)
			}
			return defaultLimit(next)(c)
		}
	})

	// Security headers (FR-059)
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Response().Header()
			h.Set("X-Frame-Options", "DENY")
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
			h.Set("Content-Security-Policy", "default-src 'self'; script-src 'self' blob: https://cdn.tailwindcss.com https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://unpkg.com; frame-src https://accounts.google.com https://apis.google.com https://*.firebaseapp.com; worker-src 'self' blob:; frame-ancestors 'none'")
			return next(c)
		}
	})

	// Custom JSON error handler
	e.HTTPErrorHandler = jsonErrorHandler

	return &Server{
		Echo:   e,
		Config: cfg,
	}
}

func jsonErrorHandler(err error, c echo.Context) {
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

	if code >= http.StatusInternalServerError {
		log.Printf("[ERROR] HTTP %d %s %s: %v", code, c.Request().Method, c.Request().URL.Path, err)
	}

	resp := map[string]string{"error": msg}
	if code == http.StatusInternalServerError {
		resp["error"] = "internal server error"
	}

	_ = c.JSON(code, resp)
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%s", s.Config.Port)
	return s.Echo.Start(addr)
}
