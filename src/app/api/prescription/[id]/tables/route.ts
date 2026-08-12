import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { tables } = body

    if (!Array.isArray(tables)) {
      return NextResponse.json({ error: 'tables array is required' }, { status: 400 })
    }

    // Verify prescription ownership
    const prescription = await db.prescription.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    })
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: prescription.doctorId, userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing tables
    await db.pDignoTable.deleteMany({ where: { prescriptionId: id } })

    // Create new table records
    if (tables.length > 0) {
      await db.pDignoTable.createMany({
        data: tables.map((t: Record<string, unknown>) => ({
          prescriptionId: id,
          templateId: t.templateId || null,
          rows: Math.max(1, Number(t.rows) || 1),
          cols: Math.max(1, Number(t.cols) || 1),
          headerLabel: JSON.stringify(t.headerLabel || []),
          colsLabel: JSON.stringify(t.colsLabel || []),
          footerLabel: JSON.stringify(t.footerLabel || []),
          extraLabel: String(t.extraLabel || ''),
          createdById: user.id,
        })),
      })
    }

    const savedTables = await db.pDignoTable.findMany({
      where: { prescriptionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ tables: savedTables })
  } catch (error) {
    console.error('Save tables error:', error)
    return NextResponse.json({ error: 'Failed to save tables' }, { status: 500 })
  }
}
