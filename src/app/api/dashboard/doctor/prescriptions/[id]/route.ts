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

    // First, try to find as own prescription
    let prescription = await db.prescription.findFirst({
      where: { id, doctorId: doctor.id },
      include: {
        booking: {
          include: {
            user: { select: { name: true, profileImg: true, gender: true, id: true } },
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

    // If not own, check if patient has granted access via PrescriptionAccessRequest
    if (!prescription) {
      const accessGranted = await db.prescriptionAccessRequest.findFirst({
        where: {
          prescriptionId: id,
          requestingDoctorId: doctor.id,
          status: 'Approved',
        },
      })

      if (accessGranted) {
        prescription = await db.prescription.findUnique({
          where: { id },
          include: {
            booking: {
              include: {
                user: { select: { name: true, profileImg: true, gender: true, id: true } },
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
      }
    }

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    // Determine if this is a shared prescription
    const isShared = prescription.doctorId !== doctor.id

    return NextResponse.json({
      prescription: {
        ...prescription,
        isShared,
      },
    })
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

    // Only the original doctor can edit a prescription
    const existing = await db.prescription.findFirst({
      where: { id, doctorId: doctor.id },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Prescription not found or you do not have edit permission for shared prescriptions' },
        { status: 404 }
      )
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
