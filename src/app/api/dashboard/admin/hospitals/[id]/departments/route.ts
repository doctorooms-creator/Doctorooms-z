import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, 'admin')
    const { id } = await params

    const hospital = await db.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const departments = await db.department.findMany({
      where: { hospitalId: id },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Admin fetch departments error:', error)
    return NextResponse.json({ error: 'Failed to load departments' }, { status: 500 })
  }
}
