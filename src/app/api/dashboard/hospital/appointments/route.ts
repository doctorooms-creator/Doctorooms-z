import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'
import { resolveAvatarUrl } from '@/lib/avatar-url'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'hospital')

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'all'
    const doctorFilter = searchParams.get('doctorId') || 'all'
    const departmentFilter = searchParams.get('departmentId') || 'all'
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {
      doctor: { hospitalId: hospital.id },
    }
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    if (doctorFilter !== 'all') {
      where.doctorId = doctorFilter
    }
    if (departmentFilter !== 'all') {
      where.departmentId = departmentFilter
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { appointmentNo: { contains: search } },
      ]
    }

    const [appointments, doctors, departments] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            include: { user: { select: { name: true, profileImg: true } } },
          },
          user: { select: { name: true, profileImg: true } },
          department: {
            select: { id: true, name: true },
          },
        },
      }),
      db.doctor.findMany({
        where: { hospitalId: hospital.id },
        select: { id: true, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.department.findMany({
        where: { hospitalId: hospital.id, status: 'Active' },
        select: { id: true, name: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const statusCounts = await db.booking.groupBy({
      by: ['status'],
      where: { doctor: { hospitalId: hospital.id } },
      _count: { status: true },
    })
    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.status])
    )

    return NextResponse.json({
      appointments: appointments.map((b) => ({
        id: b.id,
        appointmentNo: b.appointmentNo,
        patientName: b.patientName || b.user?.name || 'Walk-in',
        patientImg: resolveAvatarUrl(b.user?.profileImg),
        doctorName: b.doctor?.user?.name || 'Unknown',
        doctorImg: resolveAvatarUrl(b.doctor?.user?.profileImg),
        doctorId: b.doctorId,
        date: b.bookingDate,
        status: b.status,
        charge: b.appointmentCharge,
        disease: b.disease,
        bookingType: b.bookingType,
        createdAt: b.createdAt,
        tokenNumber: b.tokenNumber || null,
        tokenOrder: b.tokenOrder || null,
        departmentId: b.departmentId || null,
        departmentName: b.department?.name || null,
      })),
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
      })),
      departments,
      statusCounts: statusCountMap,
    })
  } catch (error) {
    console.error('Hospital appointments list error:', error)
    return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
  }
}
