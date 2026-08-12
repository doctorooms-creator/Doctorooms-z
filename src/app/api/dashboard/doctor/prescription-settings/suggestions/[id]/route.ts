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

    const existing = await db.suggestionsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const body = await req.json()
    const { questionId, suggestions, suggestionsEn, status } = body

    if (suggestions !== undefined && !suggestions.trim()) {
      return NextResponse.json({ error: 'Suggestion cannot be empty' }, { status: 400 })
    }

    // Validate questionId if provided
    if (questionId !== undefined && questionId !== null && questionId !== '') {
      const qExists = await db.questionsMaster.findFirst({
        where: { id: questionId, doctorId: doctor.id },
      })
      if (!qExists) {
        return NextResponse.json({ error: 'Selected question not found' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (questionId !== undefined) updateData.questionId = questionId.trim()
    if (suggestions !== undefined) updateData.suggestions = suggestions.trim()
    if (suggestionsEn !== undefined) updateData.suggestionsEn = typeof suggestionsEn === 'string' ? suggestionsEn.trim() : ''
    if (status !== undefined) updateData.status = status

    const updated = await db.suggestionsMaster.update({
      where: { id },
      data: updateData,
      include: {
        question: {
          select: { id: true, question: true, questionEn: true },
        },
      },
    })

    return NextResponse.json({ suggestion: updated })
  } catch (error) {
    console.error('Update suggestion error:', error)
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 })
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

    const existing = await db.suggestionsMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const updated = await db.suggestionsMaster.update({
      where: { id },
      data: { status: 'Inactive' },
      include: {
        question: {
          select: { id: true, question: true, questionEn: true },
        },
      },
    })

    return NextResponse.json({ suggestion: updated })
  } catch (error) {
    console.error('Delete suggestion error:', error)
    return NextResponse.json({ error: 'Failed to delete suggestion' }, { status: 500 })
  }
}
