package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"

	"github.com/FutureSkillr/MVP72/backend/internal/config"
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
	e.Use(echomw.BodyLimit("10M"))

	// Security headers (FR-059)
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			h := c.Response().Header()
			h.Set("X-Frame-Options", "DENY")
			h.Set("X-Content-Type-Options", "nosniff")
			h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
			h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
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
