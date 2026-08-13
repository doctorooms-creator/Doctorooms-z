import { db } from '@/lib/db'

type QueueNotificationEvent =
  | 'consultation_started'
  | 'consultation_completed'
  | 'wait_extended'
  | 'appointment_canceled'
  | 'turn_approaching'

interface QueueNotificationContext {
  bookingId: string
  doctorId: string
  patientUserId: string
  doctorName: string
  tokenNumber?: string | number | null
  departmentName?: string | null
}

/**
 * Send in-app notifications for queue/token events.
 * Called from doctor appointment status changes and prescription finalization.
 *
 * Events:
 * - consultation_started: Doctor started seeing the patient
 * - consultation_completed: Doctor finished the consultation
 * - wait_extended: Doctor extended the patient's wait
 * - appointment_canceled: Doctor canceled the appointment
 * - turn_approaching: Patient is 2 positions away from being called
 */
export async function sendQueueNotification(
  event: QueueNotificationEvent,
  ctx: QueueNotificationContext
) {
  try {
    const notifications: { userId: string; title: string; message: string }[] = []

    switch (event) {
      case 'consultation_started': {
        const tokenStr = ctx.tokenNumber ? ` (Token: ${ctx.tokenNumber})` : ''
        const deptStr = ctx.departmentName ? ` — ${ctx.departmentName}` : ''
        notifications.push({
          userId: ctx.patientUserId,
          title: 'Consultation Started',
          message: `Dr. ${ctx.doctorName}${deptStr} has started your consultation.${tokenStr} Please proceed to the consultation room.`,
        })
        break
      }

      case 'consultation_completed': {
        const tokenStr = ctx.tokenNumber ? ` (Token: ${ctx.tokenNumber})` : ''
        notifications.push({
          userId: ctx.patientUserId,
          title: 'Consultation Complete',
          message: `Your consultation with Dr. ${ctx.doctorName} is complete.${tokenStr} Please visit the pharmacy if medicines were prescribed.`,
        })
        break
      }

      case 'wait_extended': {
        notifications.push({
          userId: ctx.patientUserId,
          title: 'Wait Time Extended',
          message: `Dr. ${ctx.doctorName} has extended your wait time. Please check the queue for updated position.`,
        })
        break
      }

      case 'appointment_canceled': {
        notifications.push({
          userId: ctx.patientUserId,
          title: 'Appointment Canceled',
          message: `Your appointment with Dr. ${ctx.doctorName} has been canceled by the doctor.`,
        })
        break
      }

      case 'turn_approaching': {
        const tokenStr = ctx.tokenNumber ? ` (${ctx.tokenNumber})` : ''
        const deptStr = ctx.departmentName ? ` — ${ctx.departmentName}` : ''
        notifications.push({
          userId: ctx.patientUserId,
          title: 'Your Turn is Approaching',
          message: `Dr. ${ctx.doctorName}${deptStr} is calling the next patient soon.${tokenStr} Please be near the consultation area.`,
        })
        break
      }
    }

    if (notifications.length === 0) return

    await db.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
      })),
    })
  } catch (error) {
    // Notifications should never block the main flow
    console.error('[QueueNotification] Failed to send notification:', error)
  }
}

/**
 * After a patient's status changes to 'Visited' (doctor started consultation),
 * check if there's a patient 2 positions ahead in the queue and notify them.
 */
export async function notifyApproachingPatient(
  doctorId: string,
  currentTokenOrder: number | null,
  bookingDate: Date
) {
  if (!currentTokenOrder) return

  try {
    // Find the patient 2 positions ahead (who is still waiting)
    const approachingBooking = await db.booking.findFirst({
      where: {
        doctorId,
        bookingDate,
        status: 'Approve',
        tokenOrder: currentTokenOrder + 2,
      },
      select: {
        id: true,
        userId: true,
        tokenNumber: true,
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!approachingBooking) return

    // Check if we already sent this notification recently (within 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentNotification = await db.notification.findFirst({
      where: {
        userId: approachingBooking.userId,
        title: 'Your Turn is Approaching',
        createdAt: { gte: fiveMinAgo },
      },
    })
    if (recentNotification) return

    // Get department info if hospital mode
    let departmentName: string | null = null
    if (approachingBooking.id) {
      const bookingWithDept = await db.booking.findUnique({
        where: { id: approachingBooking.id },
        select: {
          department: { select: { name: true } },
        },
      })
      departmentName = bookingWithDept?.department?.name || null
    }

    const doctorName = approachingBooking.doctor.user.name.replace('Dr. ', '')

    await sendQueueNotification('turn_approaching', {
      bookingId: approachingBooking.id,
      doctorId,
      patientUserId: approachingBooking.userId,
      doctorName,
      tokenNumber: approachingBooking.tokenNumber,
      departmentName,
    })
  } catch (error) {
    console.error('[QueueNotification] Failed to notify approaching patient:', error)
  }
}

/**
 * After a patient's consultation finishes (status → 'Finish'),
 * notify the next patient in queue that they're up next.
 */
export async function notifyNextPatient(
  doctorId: string,
  currentTokenOrder: number | null,
  bookingDate: Date
) {
  if (!currentTokenOrder) return

  try {
    // Find the very next waiting patient
    const nextBooking = await db.booking.findFirst({
      where: {
        doctorId,
        bookingDate,
        status: 'Approve',
        tokenOrder: currentTokenOrder + 1,
      },
      select: {
        id: true,
        userId: true,
        tokenNumber: true,
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    })

    if (!nextBooking) return

    // Check for recent duplicate
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recentNotification = await db.notification.findFirst({
      where: {
        userId: nextBooking.userId,
        title: 'Your Turn is Approaching',
        createdAt: { gte: fiveMinAgo },
      },
    })
    if (recentNotification) return

    let departmentName: string | null = null
    const bookingWithDept = await db.booking.findUnique({
      where: { id: nextBooking.id },
      select: { department: { select: { name: true } } },
    })
    departmentName = bookingWithDept?.department?.name || null

    const doctorName = nextBooking.doctor.user.name.replace('Dr. ', '')

    await sendQueueNotification('turn_approaching', {
      bookingId: nextBooking.id,
      doctorId,
      patientUserId: nextBooking.userId,
      doctorName,
      tokenNumber: nextBooking.tokenNumber,
      departmentName,
    })
  } catch (error) {
    console.error('[QueueNotification] Failed to notify next patient:', error)
  }
}
