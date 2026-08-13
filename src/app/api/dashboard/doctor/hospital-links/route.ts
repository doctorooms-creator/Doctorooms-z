import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const links = await db.doctorHospital.findMany({
      where: {
        doctorId: doctor.id,
        status: 'Active',
      },
      include: {
        hospital: {
          select: { id: true, hospitalName: true, city: true, state: true },
        },
        department: {
          select: { id: true, name: true, shortCode: true, floorNo: true, opdRoom: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (links.length === 0) {
      return NextResponse.json({ hospitalLinks: [], doctorId: doctor.id, isHospitalMode: false })
    }

    return NextResponse.json({
      hospitalLinks: links.map((link) => ({
        id: link.id,
        designation: link.designation,
        fees: link.fees,
        opdTimings: link.opdTimings,
        isAvailable: link.isAvailable,
        hospital: link.hospital,
        department: link.department,
      })),
      doctorId: doctor.id,
      isHospitalMode: true,
    })
  } catch (error) {
    console.error('Hospital links error:', error)
    return NextResponse.json({ error: 'Failed to load hospital links' }, { status: 500 })
  }
}
