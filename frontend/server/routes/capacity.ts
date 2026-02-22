/**
 * Capacity Route — FR-062
 * Tracks active Gemini sessions and provides queue management.
 *
 * GET /api/capacity — check current capacity
 * POST /api/capacity/book — book an email slot
 */
import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// --- In-memory session tracking (MVP3, single instance) ---

interface ActiveSession {
  startedAt: number;
  browserSessionId: string;
}

const activeSessions = new Map<string, ActiveSession>();
const waitingQueue: string[] = []; // ticket IDs in FIFO order
const emailBookings: Map<string, { email: string; ticketId: string; bookedAt: number }> = new Map();

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_GEMINI_SESSIONS || '10', 10);
const AVG_SESSION_MS = parseInt(process.env.AVG_SESSION_DURATION_MS || '180000', 10);
const QUEUE_ENABLED = process.env.QUEUE_ENABLED === 'true';

// Session timeout — auto-release after 10 minutes of inactivity
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.startedAt > SESSION_TIMEOUT_MS) {
      activeSessions.delete(id);
    }
  }
}

/**
 * Acquire a Gemini session slot. Returns session ID or null if full.
 */
export function acquireSlot(browserSessionId: string): string | null {
  cleanupStaleSessions();
  if (!QUEUE_ENABLED) return crypto.randomUUID(); // Queue disabled: always allow

  if (activeSessions.size >= MAX_CONCURRENT) return null;

  const sessionId = crypto.randomUUID();
  activeSessions.set(sessionId, {
    startedAt: Date.now(),
    browserSessionId,
  });
  return sessionId;
}

/**
 * Release a Gemini session slot.
 */
export function releaseSlot(sessionId: string): void {
  activeSessions.delete(sessionId);
}

/**
 * Get current capacity data for flood-status (FR-065).
 */
export function getCapacityData() {
  cleanupStaleSessions();
  return {
    activeSessionCount: activeSessions.size,
    maxConcurrentSessions: MAX_CONCURRENT,
    queueLength: waitingQueue.length,
    queueEnabled: QUEUE_ENABLED,
  };
}

// --- Routes ---

// GET /api/capacity — public, no auth
router.get('/', (_req, res) => {
  cleanupStaleSessions();

  const available = !QUEUE_ENABLED || activeSessions.size < MAX_CONCURRENT;
  const ticketId = crypto.randomUUID();

  // Add to waiting queue if not available
  let position = 0;
  if (!available) {
    waitingQueue.push(ticketId);
    position = waitingQueue.length;
    // Trim old tickets (max 1000)
    while (waitingQueue.length > 1000) waitingQueue.shift();
  }

  const estimatedWaitMs = position > 0
    ? Math.round((position * AVG_SESSION_MS) / MAX_CONCURRENT)
    : 0;

  res.json({
    available,
    activeSessionCount: activeSessions.size,
    maxConcurrentSessions: MAX_CONCURRENT,
    queueEnabled: QUEUE_ENABLED,
    queue: {
      position,
      estimatedWaitMs,
      ticketId,
    },
  });
});

// POST /api/capacity/book — email slot booking
router.post('/book', (req, res) => {
  const { email, ticketId } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ booked: false, error: 'Valid email required' });
    return;
  }
  if (!ticketId || typeof ticketId !== 'string') {
    res.status(400).json({ booked: false, error: 'ticketId required' });
    return;
  }

  // Schedule a slot ~30 minutes from now (simplified for MVP3)
  const scheduledSlotUtc = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  emailBookings.set(ticketId, {
    email,
    ticketId,
    bookedAt: Date.now(),
  });

  // Trim old bookings (max 500)
  if (emailBookings.size > 500) {
    const oldest = emailBookings.keys().next().value;
    if (oldest) emailBookings.delete(oldest);
  }

  res.json({ booked: true, scheduledSlotUtc });
});

export default router;
