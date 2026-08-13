import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

// ============ GET: Available beds ============
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find receptionist profile
    const receptionist = await db.receptionist.findFirst({
      where: { userId: user.id },
      select: { hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist profile not found' }, { status: 404 })
    }

    const hospitalId = receptionist.hospitalId

    // Parse query params
    const { searchParams } = new URL(req.url)
    const wardId = searchParams.get('wardId') || ''

    // Build where clause for beds
    const bedWhere: Record<string, unknown> = {
      ward: { hospitalId },
      status: 'Available',
    }

    if (wardId) {
      bedWhere.wardId = wardId
    }

    // Fetch available beds with ward info
    const beds = await db.bed.findMany({
      where: bedWhere,
      include: {
        ward: {
          select: {
            id: true,
            name: true,
            wardType: true,
            floorNo: true,
          },
        },
      },
      orderBy: [{ ward: { name: 'asc' } }, { bedNumber: 'asc' }],
    })

    // Group beds by ward
    const wardGroups: Record<string, { ward: typeof beds[0]['ward']; beds: typeof beds }> = {}
    for (const bed of beds) {
      const wardIdKey = bed.wardId
      if (!wardGroups[wardIdKey]) {
        wardGroups[wardIdKey] = { ward: bed.ward, beds: [] }
      }
      wardGroups[wardIdKey].beds.push(bed)
    }

    const formattedBeds = beds.map((b) => ({
      id: b.id,
      bedNumber: b.bedNumber,
      bedType: b.bedType,
      dailyRate: b.dailyRate,
      wardId: b.ward.id,
      wardName: b.ward.name,
      wardType: b.ward.wardType,
      floorNo: b.ward.floorNo,
    }))

    return NextResponse.json({
      beds: formattedBeds,
      wardGroups: Object.entries(wardGroups).map(([id, group]) => ({
        wardId: id,
        wardName: group.ward.name,
        wardType: group.ward.wardType,
        floorNo: group.ward.floorNo,
        availableCount: group.beds.length,
        beds: group.beds.map((b) => ({
          id: b.id,
          bedNumber: b.bedNumber,
          bedType: b.bedType,
          dailyRate: b.dailyRate,
        })),
      })),
    })
  } catch (error) {
    console.error('Available beds error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
