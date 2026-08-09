import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const prescription = await db.prescription.findFirst({
      where: { id, doctorId: doctor.id },
      include: {
        booking: {
          include: {
            user: { select: { name: true, profileImg: true, gender: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true, mobileNo: true } },
          },
        },
        medicines: true,
        labels: true,
        suggestions: true,
      },
    })

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    return NextResponse.json({ prescription })
  } catch (error) {
    console.error('Get prescription error:', error)
    return NextResponse.json({ error: 'Failed to load prescription' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')

    const { id } = await params
    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
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

    const existing = await db.prescription.findFirst({
      where: { id, doctorId: doctor.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Delete old medicines and labels, then recreate
    await db.pMedicine.deleteMany({ where: { prescriptionId: id } })
    await db.pLabel.deleteMany({ where: { prescriptionId: id } })

    const updated = await db.prescription.update({
      where: { id },
      data: {
        patientName: patientName ?? existing.patientName,
        patientAge: patientAge ?? existing.patientAge,
        disease: disease ?? existing.disease,
        weight: weight ?? existing.weight,
        bp: bp ?? existing.bp,
        temperature: temperature ?? existing.temperature,
        description: description ?? existing.description,
        medicines: {
          create: (medicines || []).map((m: Record<string, unknown>) => ({
            medicine: m.medicine || '',
            morning: !!m.morning,
            afternoon: !!m.afternoon,
            evening: !!m.evening,
            tab: m.tab || 1,
            dose: m.dose || '',
            description: m.description || '',
            createdById: user.id,
          })),
        },
        labels: {
          create: (labels || []).map((l: Record<string, unknown>) => ({
            label: l.label || '',
            value: l.value || '',
            labelUnit: l.labelUnit || '',
            createdById: user.id,
          })),
        },
      },
      include: { medicines: true, labels: true },
    })

    return NextResponse.json({ prescription: updated })
  } catch (error) {
    console.error('Update prescription error:', error)
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}
