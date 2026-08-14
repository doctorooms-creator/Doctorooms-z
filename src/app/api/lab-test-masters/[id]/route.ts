import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/api-auth'

/** Resolve hospital auth (hospital or admin role) */
async function getHospitalAuth(request: NextRequest) {
  let user = await requireRole(request, 'hospital')
  if (!user) user = await requireRole(request, 'admin')
  if (!user) return null

  const hospital = await db.hospital.findUnique({
    where: { userId: user.id },
  })
  if (!hospital) return null
  return { user, hospitalId: hospital.id }
}

// GET /api/lab-test-masters/[id] — Get test detail with parameters
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const testMaster = await db.labTestMaster.findUnique({
      where: { id },
      include: {
        parameters: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!testMaster) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 })
    }

    return NextResponse.json({ testMaster })
  } catch (error) {
    console.error('Lab test master GET error:', error)
    return NextResponse.json({ error: 'Failed to load lab test' }, { status: 500 })
  }
}

// PUT /api/lab-test-masters/[id] — Update test (delete old params, create new)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const existing = await db.labTestMaster.findUnique({
      where: { id },
    })

    if (!existing || existing.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, shortCode, category, description, specimenType, reportDays, rate, parameters } = body

    // Delete old parameters and create new ones in transaction
    const updated = await db.$transaction(async (tx) => {
      await tx.labTestParameter.deleteMany({ where: { testMasterId: id } })

      return tx.labTestMaster.update({
        where: { id },
        data: {
          name: typeof name === 'string' ? name.trim() : undefined,
          shortCode: typeof shortCode === 'string' ? shortCode.trim() : undefined,
          category: typeof category === 'string' ? category.trim() : undefined,
          description: typeof description === 'string' ? description.trim() : undefined,
          specimenType: typeof specimenType === 'string' ? specimenType.trim() : undefined,
          reportDays: typeof reportDays === 'number' ? reportDays : undefined,
          rate: typeof rate === 'number' ? rate : undefined,
          parameters: {
            create: (Array.isArray(parameters) ? parameters : []).map(
              (p: Record<string, unknown>, idx: number) => ({
                paramName: (p.paramName as string)?.trim() || '',
                shortCode: (p.shortCode as string)?.trim() || '',
                unit: (p.unit as string)?.trim() || '',
                normalMaleMin: typeof p.normalMaleMin === 'number' ? p.normalMaleMin : 0,
                normalMaleMax: typeof p.normalMaleMax === 'number' ? p.normalMaleMax : 0,
                normalFemaleMin: typeof p.normalFemaleMin === 'number' ? p.normalFemaleMin : 0,
                normalFemaleMax: typeof p.normalFemaleMax === 'number' ? p.normalFemaleMax : 0,
                normalChildMin: typeof p.normalChildMin === 'number' ? p.normalChildMin : 0,
                normalChildMax: typeof p.normalChildMax === 'number' ? p.normalChildMax : 0,
                sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : idx,
              })
            ),
          },
        },
        include: { parameters: { orderBy: { sortOrder: 'asc' } } },
      })
    })

    return NextResponse.json({ testMaster: updated })
  } catch (error) {
    console.error('Lab test master PUT error:', error)
    return NextResponse.json({ error: 'Failed to update lab test' }, { status: 500 })
  }
}

// DELETE /api/lab-test-masters/[id] — Soft delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth
    const { id } = await params

    const existing = await db.labTestMaster.findUnique({
      where: { id },
    })

    if (!existing || existing.hospitalId !== hospitalId) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 })
    }

    await db.labTestMaster.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lab test master DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lab test' }, { status: 500 })
  }
}
