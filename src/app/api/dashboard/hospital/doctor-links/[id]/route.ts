import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Verify the link belongs to this hospital
    const existing = await db.doctorHospital.findFirst({
      where: { id, hospitalId: hospital.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Doctor link not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { designation, fees, opdTimings, isAvailable, status } = body

    const link = await db.doctorHospital.update({
      where: { id },
      data: {
        ...(designation !== undefined && { designation: String(designation).trim() }),
        ...(fees !== undefined && { fees: Number(fees) }),
        ...(opdTimings !== undefined && { opdTimings: String(opdTimings).trim() }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(status !== undefined && { status: String(status) }),
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, profileImg: true },
            },
          },
        },
        department: {
          select: { id: true, name: true, icon: true },
        },
      },
    })

    return NextResponse.json({ doctorLink: link })
  } catch (error) {
    console.error('Doctor link PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update doctor link' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, 'hospital')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hospital = await db.hospital.findUnique({
      where: { userId: user.id },
    })

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Verify the link belongs to this hospital
    const existing = await db.doctorHospital.findFirst({
      where: { id, hospitalId: hospital.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Doctor link not found' },
        { status: 404 }
      )
    }

    await db.doctorHospital.delete({ where: { id } })

    return NextResponse.json({ message: 'Doctor unlinked successfully' })
  } catch (error) {
    console.error('Doctor link DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to unlink doctor' },
      { status: 500 }
    )
  }
}
