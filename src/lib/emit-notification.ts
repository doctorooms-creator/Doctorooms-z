// Events that the notification service accepts
export type NotificationEvent =
  | 'new-admission'
  | 'vital-recorded'
  | 'sample-ordered'
  | 'lab-result-ready'
  | 'bill-generated'
  | 'payment-received'
  | 'discharge-advised'
  | 'ot-scheduled'
  | 'low-stock-alert'

const VALID_EVENTS: NotificationEvent[] = [
  'new-admission', 'vital-recorded', 'sample-ordered',
  'lab-result-ready', 'bill-generated', 'payment-received',
  'discharge-advised', 'ot-scheduled', 'low-stock-alert',
]

export function emitNotification(
  event: NotificationEvent,
  rooms: string[],
  payload: Record<string, unknown>
): void {
  // Validate event
  if (!VALID_EVENTS.includes(event)) return
  if (!rooms || rooms.length === 0) return

  // Fire and forget — never block, never throw
  fetch('http://localhost:3005/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, rooms, payload }),
  }).catch(() => {
    // Notification service down — silently ignore
  })
}

// Convenience: build hospital room string
export function hospitalRoom(hospitalId: string): string {
  return `hospital:${hospitalId}`
}

// Convenience: build role room string
export function roleRoom(role: string): string {
  return `role:${role}`
}

// Convenience: build user room string  
export function userRoom(userId: string): string {
  return `user:${userId}`
}
