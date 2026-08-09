import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { doctorId: doctor.id }
    if (search) {
      where.patientName = { contains: search }
    }

    const prescriptions = await db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        medicines: true,
        labels: true,
        suggestions: true,
      },
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Doctor prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to load prescriptions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      bookingId,
      patientName,
      patientAge,
      disease,
      weight,
      bp,
      temperature,
      description,
      medicines,
      labels,
    } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
    }

    const prescription = await db.prescription.create({
      data: {
        bookingId,
        doctorId: doctor.id,
        patientName: patientName || '',
        patientAge: patientAge || '',
        disease: disease || '',
        weight: weight || '',
        bp: bp || '',
        temperature: temperature || '',
        description: description || '',
        medicines: {
          create: (medicines || []).map((m: Record<string, unknown>) => ({
            medicine: m.medicine || '',
            morning: !!m.morning,
            afternoon: !!m.afternoon,
            evening: !!m.evening,
            tab: m.tab || 1,
            dose: m.dose || '',
            description: m.description || '',
            createdById: session.user.id,
          })),
        },
        labels: {
          create: (labels || []).map((l: Record<string, unknown>) => ({
            label: l.label || '',
            value: l.value || '',
            labelUnit: l.labelUnit || '',
            createdById: session.user.id,
          })),
        },
      },
      include: { medicines: true, labels: true },
    })

    return NextResponse.json({ prescription }, { status: 201 })
  } catch (error) {
    console.error('Create prescription error:', error)
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}
