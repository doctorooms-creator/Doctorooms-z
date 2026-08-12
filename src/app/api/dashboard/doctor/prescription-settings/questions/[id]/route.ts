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

    const existing = await db.questionsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const body = await req.json()
    const { question, questionEn, explanation, coId, status } = body

    if (question !== undefined && !question.trim()) {
      return NextResponse.json({ error: 'Question cannot be empty' }, { status: 400 })
    }

    // Validate coId if provided
    if (coId !== undefined && coId !== null && coId !== '') {
      const coExists = await db.coMaster.findFirst({
        where: { id: coId, doctorId: doctor.id },
      })
      if (!coExists) {
        return NextResponse.json({ error: 'Selected complaint not found' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (question !== undefined) updateData.question = question.trim()
    if (questionEn !== undefined) updateData.questionEn = typeof questionEn === 'string' ? questionEn.trim() : ''
    if (explanation !== undefined) updateData.explanation = typeof explanation === 'string' ? explanation.trim() : ''
    if (coId !== undefined) updateData.coId = coId === '' || coId === null ? null : coId
    if (status !== undefined) updateData.status = status

    const updated = await db.questionsMaster.update({
      where: { id },
      data: updateData,
      include: {
        co: {
          select: { id: true, coDetail: true, coDetailEn: true },
        },
      },
    })

    return NextResponse.json({ question: updated })
  } catch (error) {
    console.error('Update question error:', error)
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
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

    const existing = await db.questionsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const updated = await db.questionsMaster.update({
      where: { id },
      data: { status: 'Inactive' },
      include: {
        co: {
          select: { id: true, coDetail: true, coDetailEn: true },
        },
      },
    })

    return NextResponse.json({ question: updated })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
