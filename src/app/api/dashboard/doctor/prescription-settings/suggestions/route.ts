import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim() || ''
    const statusFilter = searchParams.get('status') || 'Active'
    const questionId = searchParams.get('questionId')?.trim() || ''

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const where: Prisma.SuggestionsMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (questionId) {
      where.questionId = questionId
    }

    if (search) {
      where.OR = [
        { suggestions: { contains: search } },
        { suggestionsEn: { contains: search } },
      ]
    }

    const suggestions = await db.suggestionsMaster.findMany({
      where,
      include: {
        question: {
          select: { id: true, question: true, questionEn: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Suggestions GET error:', error)
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { questionId, suggestions, suggestionsEn, status } = body

    if (!questionId || !questionId.trim()) {
      return NextResponse.json({ error: 'Parent question is required' }, { status: 400 })
    }

    if (!suggestions || !suggestions.trim()) {
      return NextResponse.json({ error: 'Suggestion is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Validate questionId belongs to this doctor
    const qExists = await db.questionsMaster.findFirst({
      where: { id: questionId, doctorId: doctor.id },
    })
    if (!qExists) {
      return NextResponse.json({ error: 'Selected question not found' }, { status: 400 })
    }

    const newSuggestion = await db.suggestionsMaster.create({
      data: {
        questionId: questionId.trim(),
        suggestions: suggestions.trim(),
        suggestionsEn: typeof suggestionsEn === 'string' ? suggestionsEn.trim() : '',
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
      include: {
        question: {
          select: { id: true, question: true, questionEn: true },
        },
      },
    })

    return NextResponse.json({ suggestion: newSuggestion }, { status: 201 })
  } catch (error) {
    console.error('Create suggestion error:', error)
    return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 })
  }
}
