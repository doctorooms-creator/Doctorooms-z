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

// POST /api/lab-test-masters — Create test with parameters
export async function POST(request: NextRequest) {
  try {
    const auth = await getHospitalAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { hospitalId } = auth

    const body = await request.json()
    const { name, shortCode, category, description, specimenType, reportDays, rate, parameters } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Test name is required' }, { status: 400 })
    }

    const testMaster = await db.labTestMaster.create({
      data: {
        hospitalId,
        name: name.trim(),
        shortCode: shortCode?.trim() || '',
        category: category?.trim() || '',
        description: description?.trim() || '',
        specimenType: specimenType?.trim() || '',
        reportDays: typeof reportDays === 'number' ? reportDays : 0,
        rate: typeof rate === 'number' ? rate : 0,
        parameters: {
          create: (Array.isArray(parameters) ? parameters : []).map((p: Record<string, unknown>, idx: number) => ({
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
          })),
        },
      },
      include: { parameters: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json({ testMaster }, { status: 201 })
  } catch (error) {
    console.error('Lab test masters POST error:', error)
    return NextResponse.json({ error: 'Failed to create lab test' }, { status: 500 })
  }
}

// GET /api/lab-test-masters — List tests
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['hospital', 'admin', 'doctor', 'receptionist']
    if (!allowedRoles.includes(user.role) && user.role !== 'lab_technician') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || 'Active'
    const search = searchParams.get('search') || undefined

    // Resolve hospitalId based on role
    let hospitalId: string | undefined
    if (user.role === 'hospital') {
      const hospital = await db.hospital.findUnique({ where: { userId: user.id } })
      if (!hospital) return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
      hospitalId = hospital.id
    } else if (user.role === 'lab_technician') {
      const tech = await db.labTechnician.findUnique({ where: { userId: user.id } })
      if (!tech) return NextResponse.json({ error: 'Lab technician not found' }, { status: 404 })
      hospitalId = tech.hospitalId
    } else if (user.role === 'doctor') {
      const doctor = await db.doctor.findUnique({ where: { userId: user.id } })
      if (doctor) hospitalId = doctor.hospitalId
    } else if (user.role === 'receptionist') {
      const receptionist = await db.receptionist.findUnique({ where: { userId: user.id } })
      if (receptionist) hospitalId = receptionist.hospitalId
    }
    // admin gets all

    const tests = await db.labTestMaster.findMany({
      where: {
        ...(hospitalId && { hospitalId }),
        ...(status && { status }),
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { shortCode: { contains: search } },
          ],
        }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { parameters: true } },
      },
    })

    return NextResponse.json({ testMasters: tests })
  } catch (error) {
    console.error('Lab test masters GET error:', error)
    return NextResponse.json({ error: 'Failed to load lab tests' }, { status: 500 })
  }
}
