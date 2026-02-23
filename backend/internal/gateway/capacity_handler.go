package gateway

import (
	"math"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type activeSession struct {
	startedAt        time.Time
	browserSessionID string
}

type CapacityHandler struct {
	mu              sync.Mutex
	activeSessions  map[string]*activeSession
	waitingQueue    []string
	emailBookings   map[string]emailBooking
	maxConcurrent   int
	avgSessionMs    int
	queueEnabled    bool
	sessionTimeout  time.Duration
}

type emailBooking struct {
	Email    string
	TicketID string
	BookedAt time.Time
}

func NewCapacityHandler() *CapacityHandler {
	maxConcurrent := 10
	if v := os.Getenv("MAX_CONCURRENT_GEMINI_SESSIONS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			maxConcurrent = n
		}
	}
	avgSessionMs := 180000
	if v := os.Getenv("AVG_SESSION_DURATION_MS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			avgSessionMs = n
		}
	}
	queueEnabled := os.Getenv("QUEUE_ENABLED") == "true"

	return &CapacityHandler{
		activeSessions: make(map[string]*activeSession),
		waitingQueue:   nil,
		emailBookings:  make(map[string]emailBooking),
		maxConcurrent:  maxConcurrent,
		avgSessionMs:   avgSessionMs,
		queueEnabled:   queueEnabled,
		sessionTimeout: 10 * time.Minute,
	}
}

func (h *CapacityHandler) cleanupStale() {
	now := time.Now()
	for id, s := range h.activeSessions {
		if now.Sub(s.startedAt) > h.sessionTimeout {
			delete(h.activeSessions, id)
		}
	}
}

// GetCapacity handles GET /api/capacity — public.
func (h *CapacityHandler) GetCapacity(c echo.Context) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.cleanupStale()

	available := !h.queueEnabled || len(h.activeSessions) < h.maxConcurrent
	ticketID := uuid.New().String()

	position := 0
	if !available {
		h.waitingQueue = append(h.waitingQueue, ticketID)
		position = len(h.waitingQueue)
		// Trim old tickets (max 1000)
		for len(h.waitingQueue) > 1000 {
			h.waitingQueue = h.waitingQueue[1:]
		}
	}

	estimatedWaitMs := 0
	if position > 0 {
		estimatedWaitMs = int(math.Round(float64(position*h.avgSessionMs) / float64(h.maxConcurrent)))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"available":             available,
		"activeSessionCount":    len(h.activeSessions),
		"maxConcurrentSessions": h.maxConcurrent,
		"queueEnabled":          h.queueEnabled,
		"queue": map[string]interface{}{
			"position":        position,
			"estimatedWaitMs": estimatedWaitMs,
			"ticketId":        ticketID,
		},
	})
}

// BookSlot handles POST /api/capacity/book — public.
func (h *CapacityHandler) BookSlot(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		TicketID string `json:"ticketId"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Email == "" || !isValidEmail(req.Email) {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"booked": false,
			"error":  "Valid email required",
		})
	}
	if req.TicketID == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"booked": false,
			"error":  "ticketId required",
		})
	}

	scheduledSlotUTC := time.Now().Add(30 * time.Minute).UTC().Format(time.RFC3339)

	h.mu.Lock()
	h.emailBookings[req.TicketID] = emailBooking{
		Email:    req.Email,
		TicketID: req.TicketID,
		BookedAt: time.Now(),
	}
	// Trim old bookings (max 500)
	if len(h.emailBookings) > 500 {
		for k := range h.emailBookings {
			delete(h.emailBookings, k)
			break
		}
	}
	h.mu.Unlock()

	return c.JSON(http.StatusOK, map[string]interface{}{
		"booked":           true,
		"scheduledSlotUtc": scheduledSlotUTC,
	})
}

// AcquireSlot attempts to allocate a Gemini session slot. Used by AI handler.
func (h *CapacityHandler) AcquireSlot(browserSessionID string) string {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.cleanupStale()

	if !h.queueEnabled {
		return uuid.New().String()
	}
	if len(h.activeSessions) >= h.maxConcurrent {
		return ""
	}

	sessionID := uuid.New().String()
	h.activeSessions[sessionID] = &activeSession{
		startedAt:        time.Now(),
		browserSessionID: browserSessionID,
	}
	return sessionID
}

// ReleaseSlot frees a Gemini session slot.
func (h *CapacityHandler) ReleaseSlot(sessionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.activeSessions, sessionID)
}

func isValidEmail(email string) bool {
	for i, c := range email {
		if c == '@' && i > 0 && i < len(email)-1 {
			return true
		}
	}
	return false
}
