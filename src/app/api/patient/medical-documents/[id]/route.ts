import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, category, description } = body

    const doc = await db.medicalDocument.findUnique({ where: { id } })
    if (!doc || doc.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await db.medicalDocument.update({
      where: { id },
      data: { title, category, description },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Document update error:', error)
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'patient') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const doc = await db.medicalDocument.findUnique({ where: { id } })
    if (!doc || doc.patientId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.medicalDocument.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
