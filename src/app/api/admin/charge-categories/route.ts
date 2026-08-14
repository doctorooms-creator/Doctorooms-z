import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    const where: Prisma.ChargeCategoryWhereInput = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const categories = await db.chargeCategory.findMany({
      where,
      include: {
        hospital: { select: { hospitalName: true } },
        _count: { select: { chargeItems: true } },
      },
      orderBy: [{ hospitalId: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        taxPercent: c.taxPercent,
        status: c.status,
        hospitalName: c.hospital.hospitalName,
        itemsCount: c._count.chargeItems,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Admin charge categories error:', error)
    return NextResponse.json({ error: 'Failed to load charge categories' }, { status: 500 })
  }
}
