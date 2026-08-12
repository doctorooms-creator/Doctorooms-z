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

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const where: Prisma.TableTemplateMasterWhereInput = {
      doctorId: doctor.id,
    }

    if (statusFilter !== 'All') {
      where.status = statusFilter
    }

    if (search) {
      where.name = { contains: search }
    }

    const templates = await db.tableTemplateMaster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Table templates GET error:', error)
    return NextResponse.json({ error: 'Failed to load table templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, rows, cols, headerLabel, colsLabel, footerLabel, extraLabel, status } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Validate and stringify JSON fields
    const safeRows = typeof rows === 'number' ? Math.max(1, Math.min(rows, 20)) : 3
    const safeCols = typeof cols === 'number' ? Math.max(1, Math.min(cols, 10)) : 2

    let safeHeaderLabel = '[]'
    if (Array.isArray(headerLabel)) {
      safeHeaderLabel = JSON.stringify(headerLabel)
    } else if (typeof headerLabel === 'string' && headerLabel.trim()) {
      try {
        const parsed = JSON.parse(headerLabel)
        if (Array.isArray(parsed)) safeHeaderLabel = JSON.stringify(parsed)
      } catch { /* ignore, keep default */ }
    }

    let safeColsLabel = '[]'
    if (Array.isArray(colsLabel)) {
      safeColsLabel = JSON.stringify(colsLabel)
    } else if (typeof colsLabel === 'string' && colsLabel.trim()) {
      try {
        const parsed = JSON.parse(colsLabel)
        if (Array.isArray(parsed)) safeColsLabel = JSON.stringify(parsed)
      } catch { /* ignore, keep default */ }
    }

    let safeFooterLabel = '[]'
    if (Array.isArray(footerLabel)) {
      safeFooterLabel = JSON.stringify(footerLabel)
    } else if (typeof footerLabel === 'string' && footerLabel.trim()) {
      try {
        const parsed = JSON.parse(footerLabel)
        if (Array.isArray(parsed)) safeFooterLabel = JSON.stringify(parsed)
      } catch { /* ignore, keep default */ }
    }

    const template = await db.tableTemplateMaster.create({
      data: {
        name: name.trim(),
        rows: safeRows,
        cols: safeCols,
        headerLabel: safeHeaderLabel,
        colsLabel: safeColsLabel,
        footerLabel: safeFooterLabel,
        extraLabel: typeof extraLabel === 'string' ? extraLabel.trim() : '',
        status: status === 'Inactive' ? 'Inactive' : 'Active',
        doctorId: doctor.id,
        createdById: user.id,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create table template error:', error)
    return NextResponse.json({ error: 'Failed to create table template' }, { status: 500 })
  }
}
