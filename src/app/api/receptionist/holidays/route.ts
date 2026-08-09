import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

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

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = { userId: doctor.userId }
    if (from || to) {
      where.date = {}
      if (from) (where.date as Record<string, unknown>).gte = new Date(from)
      if (to) (where.date as Record<string, unknown>).lte = new Date(to)
    }

    const holidays = await db.doctorHoliday.findMany({
      where,
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ holidays })
  } catch (error) {
    console.error('Receptionist holidays list error:', error)
    return NextResponse.json({ error: 'Failed to load holidays' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

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

    const body = await req.json()
    const { date, remark } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const holidayDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    holidayDate.setHours(0, 0, 0, 0)

    if (holidayDate < today) {
      return NextResponse.json({ error: 'Cannot add a holiday in the past' }, { status: 400 })
    }

    // Check for duplicate
    const existing = await db.doctorHoliday.findFirst({
      where: {
        userId: doctor.userId,
        date: holidayDate,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Holiday already exists for this date' }, { status: 409 })
    }

    const holiday = await db.doctorHoliday.create({
      data: {
        userId: doctor.userId,
        date: holidayDate,
        remark: remark || '',
      },
    })

    return NextResponse.json(holiday, { status: 201 })
  } catch (error) {
    console.error('Receptionist holiday create error:', error)
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 })
  }
}
