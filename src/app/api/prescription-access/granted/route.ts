import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

import { resolveAvatarUrl } from '@/lib/avatar-url'

/**
 * GET /api/prescription-access/granted
 * Doctor lists prescriptions that patients have granted them access to.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      requestingDoctorId: doctor.id,
      status: 'Approved',
    }

    const accessRecords = await db.prescriptionAccessRequest.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        prescription: {
          include: {
            medicines: true,
            labels: true,
            suggestions: true,
            originalDoctor: {
              include: {
                user: { select: { name: true, profileImg: true } },
              },
            },
          },
        },
        originalDoctor: {
          include: {
            user: { select: { name: true, profileImg: true, specialization: true } },
          },
        },
        patient: {
          select: { name: true, profileImg: true },
        },
      },
    })

    // Filter by search if provided
    const filtered = search
      ? accessRecords.filter(
          (r) =>
            r.prescription.patientName.toLowerCase().includes(search.toLowerCase()) ||
            r.patient.name.toLowerCase().includes(search.toLowerCase())
        )
      : accessRecords

    return NextResponse.json({
      prescriptions: filtered.map((r) => ({
        id: r.prescription.id,
        patientName: r.prescription.patientName,
        patientAge: r.prescription.patientAge,
        disease: r.prescription.disease,
        weight: r.prescription.weight,
        bp: r.prescription.bp,
        temperature: r.prescription.temperature,
        description: r.prescription.description,
        createdAt: r.prescription.createdAt,
        medicines: r.prescription.medicines,
        labels: r.prescription.labels,
        suggestions: r.prescription.suggestions,
        // Shared metadata
        accessGrantedAt: r.updatedAt,
        originalDoctorName: r.originalDoctor.user.name,
        originalDoctorImg: resolveAvatarUrl(r.originalDoctor.user.profileImg),
        originalDoctorSpecialization: r.originalDoctor.specialization,
        patientImg: resolveAvatarUrl(r.patient.profileImg),
        isShared: true,
      })),
    })
  } catch (error) {
    console.error('Granted prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to load shared prescriptions' }, { status: 500 })
  }
}
