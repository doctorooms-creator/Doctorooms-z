import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'receptionist')
    if (!user) {
      const hospitalUser = await requireRole(request, 'hospital')
      const adminUser = await requireRole(request, 'admin')
      if (!hospitalUser && !adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id } = await params

    const familyAccess = await db.familyAccess.findUnique({
      where: { id },
      include: {
        admission: {
          select: { patientName: true, admissionNo: true },
        },
      },
    })

    if (!familyAccess) {
      return NextResponse.json({ error: 'Family access not found' }, { status: 404 })
    }

    if (!familyAccess.isActive) {
      return NextResponse.json({ error: 'Already revoked' }, { status: 400 })
    }

    await db.familyAccess.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: `Access revoked for ${familyAccess.admission.patientName}`,
    })
  } catch (error) {
    console.error('Revoke family access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
