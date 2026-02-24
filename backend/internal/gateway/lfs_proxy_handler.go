package gateway

import (
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

// LFSProxyHandler proxies binary uploads to an external LFS-Proxy service.
type LFSProxyHandler struct {
	targetURL string
	client    *http.Client
}

// NewLFSProxyHandler creates a new LFS proxy handler.
func NewLFSProxyHandler(targetURL string) *LFSProxyHandler {
	return &LFSProxyHandler{
		targetURL: targetURL,
		client:    &http.Client{Timeout: 5 * time.Minute},
	}
}

// lfsHeaders are the headers forwarded to the upstream LFS-Proxy.
var lfsHeaders = []string{
	"X-Kafka-Topic",
	"X-Kafka-Key",
	"X-LFS-Size",
	"X-LFS-Mode",
	"Content-Type",
}

// Produce forwards the upload request to the upstream LFS-Proxy.
func (h *LFSProxyHandler) Produce(c echo.Context) error {
	upstreamURL := h.targetURL + "/lfs/produce"

	req, err := http.NewRequestWithContext(
		c.Request().Context(),
		http.MethodPost,
		upstreamURL,
		c.Request().Body,
	)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create upstream request")
	}

	// Forward LFS-specific headers
	for _, hdr := range lfsHeaders {
		if v := c.Request().Header.Get(hdr); v != "" {
			req.Header.Set(hdr, v)
		}
	}

	resp, err := h.client.Do(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, fmt.Sprintf("upstream error: %v", err))
	}
	defer resp.Body.Close()

	// Forward upstream status and body back to the client
	for k, vs := range resp.Header {
		for _, v := range vs {
			c.Response().Header().Add(k, v)
		}
	}
	c.Response().WriteHeader(resp.StatusCode)

	if _, err := io.Copy(c.Response(), resp.Body); err != nil {
		return fmt.Errorf("copy response body: %w", err)
	}

	return nil
}
