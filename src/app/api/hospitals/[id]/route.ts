import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const hospital = await db.hospital.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImg: true,
            status: true,
          },
        },
        departments: {
          where: { status: 'Active' },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            nameHi: true,
            description: true,
            icon: true,
            floorNo: true,
            opdRoom: true,
            sortOrder: true,
            _count: {
              select: { doctorLinks: { where: { status: 'Active' } } },
            },
          },
        },
      },
    })

    if (!hospital || hospital.user.status !== 'Active') {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { user, departments, ...hospitalInfo } = hospital

    return NextResponse.json({
      ...hospitalInfo,
      user,
      departments: departments.map((dept) => ({
        ...dept,
        doctorCount: dept._count.doctorLinks,
      })),
      totalDoctors: departments.reduce(
        (sum, dept) => sum + dept._count.doctorLinks,
        0
      ),
    })
  } catch (error) {
    console.error('Hospital detail error:', error)
    return NextResponse.json(
      { error: 'Failed to load hospital details' },
      { status: 500 }
    )
  }
}
