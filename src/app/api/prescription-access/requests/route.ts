import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

/**
 * GET /api/prescription-access/requests
 * Patient lists their prescription access requests (pending + history).
 * Query params: ?status=Pending|Approved|Rejected|all
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') || 'all'

    const where: Record<string, unknown> = { patientId: user.id }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }

    const requests = await db.prescriptionAccessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        prescription: {
          select: {
            id: true,
            disease: true,
            createdAt: true,
            patientName: true,
          },
        },
        requestingDoctor: {
          include: {
            user: { select: { name: true, profileImg: true, specialization: true } },
          },
        },
        originalDoctor: {
          include: {
            user: { select: { name: true, specialization: true } },
          },
        },
      },
    })

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        prescriptionId: r.prescriptionId,
        prescriptionDisease: r.prescription.disease,
        prescriptionDate: r.prescription.createdAt,
        prescriptionPatientName: r.prescription.patientName,
        requestingDoctorName: r.requestingDoctor.user.name,
        requestingDoctorImg: r.requestingDoctor.user.profileImg,
        requestingDoctorSpecialization: r.requestingDoctor.specialization,
        originalDoctorName: r.originalDoctor.user.name,
        originalDoctorSpecialization: r.originalDoctor.specialization,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      pendingCount: requests.filter((r) => r.status === 'Pending').length,
    })
  } catch (error) {
    console.error('Prescription access requests list error:', error)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }
}
