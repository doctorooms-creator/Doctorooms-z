import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'receptionist')
    const { id } = await params

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'No doctor linked' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      select: { userId: true },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    const holiday = await db.doctorHoliday.findUnique({ where: { id } })

    if (!holiday || holiday.userId !== doctor.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Prevent deleting past holidays
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const holidayDate = new Date(holiday.date)
    holidayDate.setHours(0, 0, 0, 0)

    if (holidayDate < today) {
      return NextResponse.json({ error: 'Cannot delete past holidays' }, { status: 400 })
    }

    await db.doctorHoliday.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receptionist holiday delete error:', error)
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 })
  }
}
