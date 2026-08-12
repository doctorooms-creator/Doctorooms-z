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
    const coId = searchParams.get('coId')?.trim() || ''

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const where: Prisma.QuestionsMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (coId) {
      where.coId = coId
    }

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { questionEn: { contains: search } },
        { explanation: { contains: search } },
      ]
    }

    const questions = await db.questionsMaster.findMany({
      where,
      include: {
        co: {
          select: { id: true, coDetail: true, coDetailEn: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { question, questionEn, explanation, coId, status } = body

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Validate coId if provided
    if (coId) {
      const coExists = await db.coMaster.findFirst({
        where: { id: coId, doctorId: doctor.id },
      })
      if (!coExists) {
        return NextResponse.json({ error: 'Selected complaint not found' }, { status: 400 })
      }
    }

    const newQuestion = await db.questionsMaster.create({
      data: {
        question: question.trim(),
        questionEn: typeof questionEn === 'string' ? questionEn.trim() : '',
        explanation: typeof explanation === 'string' ? explanation.trim() : '',
        coId: coId || null,
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
      include: {
        co: {
          select: { id: true, coDetail: true, coDetailEn: true },
        },
      },
    })

    return NextResponse.json({ question: newQuestion }, { status: 201 })
  } catch (error) {
    console.error('Create question error:', error)
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
  }
}
