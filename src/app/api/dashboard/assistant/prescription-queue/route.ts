import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'assistant')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the assistant's linked doctor
    const assistant = await db.doctorAssistant.findUnique({
      where: { userId: user.id },
    })
    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not linked to a doctor' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Get bookings for this doctor with status Approve or Visited
    const bookings = await db.booking.findMany({
      where: {
        doctorId: assistant.doctorId,
        status: { in: ['Approve', 'Visited'] },
        ...(search
          ? {
              patientName: { contains: search, mode: 'insensitive' },
            }
          : {}),
      },
      orderBy: { bookingDate: 'desc' },
      include: {
        prescriptions: {
          include: {
            chiefComplaints: true,
          },
        },
      },
    })

    // Build the queue: bookings without prescriptions OR with only Draft prescriptions
    const queue = bookings
      .map((b) => {
        // Filter to prescriptions that are NOT finalized (i.e. Draft only — Active/Archived means already done)
        const draftRx = b.prescriptions.find((p) => p.status === 'Draft')
        const activeRx = b.prescriptions.find((p) => p.status === 'Active' || p.status === 'Archived')

        // Skip bookings that already have an Active/Archived prescription
        if (activeRx) return null

        return {
          id: b.id,
          patientName: b.patientName,
          age: b.age,
          gender: b.gender,
          bloodGroup: b.bloodGroup,
          timeSlot: b.timeSlot,
          bookingDate: b.bookingDate.toISOString(),
          status: b.status,
          prescription: draftRx
            ? {
                id: draftRx.id,
                status: draftRx.status,
                chiefComplaintsCount: draftRx.chiefComplaints.length,
              }
            : null,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ queue })
  } catch (error) {
    console.error('Assistant prescription queue error:', error)
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}
