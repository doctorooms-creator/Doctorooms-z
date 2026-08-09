import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const holidays = await db.doctorHoliday.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ holidays })
  } catch (error) {
    console.error('Doctor holidays error:', error)
    return NextResponse.json({ error: 'Failed to load holidays' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')

    const body = await req.json()
    const { date, remark } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const holiday = await db.doctorHoliday.create({
      data: {
        userId: user.id,
        date: new Date(date),
        remark: remark || '',
      },
    })

    return NextResponse.json({ holiday }, { status: 201 })
  } catch (error) {
    console.error('Create holiday error:', error)
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 })
    }

    await db.doctorHoliday.deleteMany({
      where: { id, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete holiday error:', error)
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 })
  }
}
