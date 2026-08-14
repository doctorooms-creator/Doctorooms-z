/**
 * Fire-and-forget WebSocket notification emitter.
 * Sends events to the notification mini-service (port 3005).
 * Never throws — failures are silently swallowed.
 */

type EventType =
  | 'new-admission'
  | 'vital-recorded'
  | 'sample-ordered'
  | 'lab-result-ready'
  | 'bill-generated'
  | 'payment-received'
  | 'discharge-advised'
  | 'ot-scheduled'
  | 'low-stock-alert'

const VALID_EVENTS: EventType[] = [
  'new-admission',
  'vital-recorded',
  'sample-ordered',
  'lab-result-ready',
  'bill-generated',
  'payment-received',
  'discharge-advised',
  'ot-scheduled',
  'low-stock-alert',
]

const EMIT_URL = 'http://localhost:3005/emit'

interface EmitPayload {
  id?: string
  title?: string
  message: string
  timestamp?: string
  admissionId?: string
  patientName?: string
  doctorId?: string
  hospitalId?: string
  [key: string]: unknown
}

/**
 * Emit a real-time notification event.
 * Fire-and-forget: does NOT await, does NOT throw.
 */
export function emitNotification(
  event: EventType,
  rooms: string[],
  payload: EmitPayload
): void {
  if (!VALID_EVENTS.includes(event)) return

  try {
    fetch(EMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        rooms,
        payload: {
          ...payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        },
      }),
    }).catch(() => {
      // Fire-and-forget: silently ignore failures
    })
  } catch {
    // Never let notification failures affect business logic
  }
}

export type { EventType, EmitPayload }

/** Room name helpers */
export function roleRoom(role: string): string {
  return `role:${role}`
}

export function hospitalRoom(hospitalId: string): string {
  return `hospital:${hospitalId}`
}
