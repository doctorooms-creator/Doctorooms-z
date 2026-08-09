import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
      ]
    }

    const inquiries = await db.hospitalInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      inquiries: inquiries.map((inq) => ({
        id: inq.id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        subject: inq.subject,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt,
      })),
      total: inquiries.length,
      unread: inquiries.filter((i) => i.status === 'Pending').length,
      read: inquiries.filter((i) => i.status === 'Read').length,
    })
  } catch (error) {
    console.error('Admin inquiries list error:', error)
    return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const inquiry = await db.hospitalInquiry.findUnique({ where: { id } })
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    const updated = await db.hospitalInquiry.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, inquiry: updated })
  } catch (error) {
    console.error('Update inquiry error:', error)
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const inquiry = await db.hospitalInquiry.findUnique({ where: { id } })
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    await db.hospitalInquiry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete inquiry error:', error)
    return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 })
  }
}
