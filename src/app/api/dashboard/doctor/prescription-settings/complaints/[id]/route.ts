import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.coMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const body = await req.json()
    const { coCode, coDetail, coDetailEn, categoryId, status } = body

    if (coDetail !== undefined && !coDetail.trim()) {
      return NextResponse.json({ error: 'Complaint detail cannot be empty' }, { status: 400 })
    }

    // Validate categoryId if provided
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      const catExists = await db.categoryMaster.findFirst({
        where: { id: categoryId, doctorId: doctor.id },
      })
      if (!catExists) {
        return NextResponse.json({ error: 'Selected category not found' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (coCode !== undefined) updateData.coCode = typeof coCode === 'string' ? coCode.trim() : ''
    if (coDetail !== undefined) updateData.coDetail = coDetail.trim()
    if (coDetailEn !== undefined) updateData.coDetailEn = typeof coDetailEn === 'string' ? coDetailEn.trim() : ''
    if (categoryId !== undefined) updateData.categoryId = categoryId === '' || categoryId === null ? null : categoryId
    if (status !== undefined) updateData.status = status

    const complaint = await db.coMaster.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Update complaint error:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const existing = await db.coMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    const complaint = await db.coMaster.update({
      where: { id },
      data: { status: 'Inactive' },
      include: {
        category: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    })

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Delete complaint error:', error)
    return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
  }
}
