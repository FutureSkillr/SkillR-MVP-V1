/**
 * Capacity Client Service — FR-062
 * Client-side wrapper for the capacity API.
 */

export interface CapacityStatus {
  available: boolean;
  activeSessionCount: number;
  maxConcurrentSessions: number;
  queueEnabled: boolean;
  queue: {
    position: number;
    estimatedWaitMs: number;
    ticketId: string;
  };
}

export interface BookingResponse {
  booked: boolean;
  scheduledSlotUtc?: string;
  error?: string;
}

/**
 * Check current capacity status from the server.
 * Returns null on network error (graceful degradation — allow through).
 */
export async function checkCapacity(): Promise<CapacityStatus | null> {
  try {
    const res = await fetch('/api/capacity');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // Graceful degradation: allow through
  }
}

/**
 * Book an email slot for later access.
 */
export async function bookEmailSlot(email: string, ticketId: string): Promise<BookingResponse> {
  try {
    const res = await fetch('/api/capacity/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ticketId }),
    });
    return res.json();
  } catch {
    return { booked: false, error: 'Network error' };
  }
}
