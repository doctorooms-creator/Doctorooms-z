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
    const categoryId = searchParams.get('categoryId')?.trim() || ''

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const where: Prisma.CoMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { coDetail: { contains: search } },
        { coDetailEn: { contains: search } },
        { coCode: { contains: search } },
      ]
    }

    const complaints = await db.coMaster.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, nameEn: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
  } catch (error) {
    console.error('Complaints GET error:', error)
    return NextResponse.json({ error: 'Failed to load complaints' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { coCode, coDetail, coDetailEn, categoryId, status } = body

    if (!coDetail || !coDetail.trim()) {
      return NextResponse.json({ error: 'Complaint detail is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Validate categoryId if provided
    if (categoryId) {
      const catExists = await db.categoryMaster.findFirst({
        where: { id: categoryId, doctorId: doctor.id },
      })
      if (!catExists) {
        return NextResponse.json({ error: 'Selected category not found' }, { status: 400 })
      }
    }

    const complaint = await db.coMaster.create({
      data: {
        coCode: typeof coCode === 'string' ? coCode.trim() : '',
        coDetail: coDetail.trim(),
        coDetailEn: typeof coDetailEn === 'string' ? coDetailEn.trim() : '',
        categoryId: categoryId || null,
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
      include: {
        category: {
          select: { id: true, name: true, nameEn: true },
        },
      },
    })

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Create complaint error:', error)
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
  }
}
