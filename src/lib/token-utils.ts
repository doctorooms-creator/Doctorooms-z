/**
 * OPD Token generation utilities for hospital mode.
 * Token format: DEPT_PREFIX-NNN (e.g. CARD-001, ORTH-015)
 * Token is per-doctor per-day, using department's shortCode as prefix.
 */

import { db } from './db'
import { todayISTRange } from './date-utils'

/**
 * Generate a token number for a doctor on a given date.
 * Format: {shortCode}-{3-digit sequence}
 * Example: CARD-001, ORTH-002
 */
export async function generateTokenNumber(doctorId: string, departmentId: string): Promise<{
  tokenNumber: string
  tokenOrder: number
}> {
  const { start: startOfDay, end: endOfDay } = todayISTRange()

  // Get department shortCode
  const dept = await db.department.findUnique({
    where: { id: departmentId },
    select: { shortCode: true },
  })

  const prefix = dept?.shortCode || 'OPD'

  // Count today's approved bookings for this doctor that already have a tokenOrder > 0
  const maxTokenOrder = await db.booking.aggregate({
    where: {
      doctorId,
      bookingDate: { gte: startOfDay, lte: endOfDay },
      tokenOrder: { gt: 0 },
    },
    _max: { tokenOrder: true },
  })

  const tokenOrder = (maxTokenOrder._max.tokenOrder || 0) + 1
  const tokenNumber = `${prefix}-${String(tokenOrder).padStart(3, '0')}`

  return { tokenNumber, tokenOrder }
}

/**
 * Get the current queue position for a doctor on a given date.
 * Counts patients ahead (same doctor, same day, earlier tokenOrder or no token but earlier createdAt).
 */
export async function getQueuePosition(
  doctorId: string,
  bookingId: string,
  bookingCreatedAt: Date
): Promise<number> {
  const { start: startOfDay, end: endOfDay } = todayISTRange()

  // Count patients with earlier tokenOrder OR same/zero tokenOrder but earlier createdAt
  const patientsAhead = await db.booking.count({
    where: {
      doctorId,
      bookingDate: { gte: startOfDay, lte: endOfDay },
      status: { in: ['Approve', 'Visited'] },
      id: { not: bookingId },
      OR: [
        { tokenOrder: { gt: 0 }, createdAt: { lt: bookingCreatedAt } },
        { tokenOrder: 0, createdAt: { lt: bookingCreatedAt } },
      ],
    },
  })

  return patientsAhead + 1
}
