import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'receptionist')
    if (!user) {
      const hospitalUser = await requireRole(request, 'hospital')
      const adminUser = await requireRole(request, 'admin')
      if (!hospitalUser && !adminUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const hospitalId = searchParams.get('hospitalId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (hospitalId) where.hospitalId = hospitalId
    if (status === 'active') where.isActive = true
    else if (status === 'revoked') where.isActive = false

    const list = await db.familyAccess.findMany({
      where,
      include: {
        admission: {
          select: {
            admissionNo: true,
            status: true,
            ward: { select: { name: true } },
            bed: { select: { bedNumber: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(list)
  } catch (error) {
    console.error('List family access error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
