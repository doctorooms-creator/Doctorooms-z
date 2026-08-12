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

    const existing = await db.tableTemplateMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, rows, cols, headerLabel, colsLabel, footerLabel, extraLabel, status } = body

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Template name cannot be empty' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (rows !== undefined) updateData.rows = Math.max(1, Math.min(Math.round(rows), 20))
    if (cols !== undefined) updateData.cols = Math.max(1, Math.min(Math.round(cols), 10))

    if (headerLabel !== undefined) {
      if (Array.isArray(headerLabel)) {
        updateData.headerLabel = JSON.stringify(headerLabel)
      } else if (typeof headerLabel === 'string') {
        try {
          const parsed = JSON.parse(headerLabel)
          if (Array.isArray(parsed)) updateData.headerLabel = JSON.stringify(parsed)
        } catch { /* keep existing */ }
      }
    }

    if (colsLabel !== undefined) {
      if (Array.isArray(colsLabel)) {
        updateData.colsLabel = JSON.stringify(colsLabel)
      } else if (typeof colsLabel === 'string') {
        try {
          const parsed = JSON.parse(colsLabel)
          if (Array.isArray(parsed)) updateData.colsLabel = JSON.stringify(parsed)
        } catch { /* keep existing */ }
      }
    }

    if (footerLabel !== undefined) {
      if (Array.isArray(footerLabel)) {
        updateData.footerLabel = JSON.stringify(footerLabel)
      } else if (typeof footerLabel === 'string') {
        try {
          const parsed = JSON.parse(footerLabel)
          if (Array.isArray(parsed)) updateData.footerLabel = JSON.stringify(parsed)
        } catch { /* keep existing */ }
      }
    }

    if (extraLabel !== undefined) updateData.extraLabel = typeof extraLabel === 'string' ? extraLabel.trim() : ''
    if (status !== undefined) updateData.status = status

    const template = await db.tableTemplateMaster.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Update table template error:', error)
    return NextResponse.json({ error: 'Failed to update table template' }, { status: 500 })
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

    const existing = await db.tableTemplateMaster.findUnique({
      where: { id },
      select: { doctorId: true },
    })
    if (!existing || existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = await db.tableTemplateMaster.update({
      where: { id },
      data: { status: 'Inactive' },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Delete table template error:', error)
    return NextResponse.json({ error: 'Failed to delete table template' }, { status: 500 })
  }
}
