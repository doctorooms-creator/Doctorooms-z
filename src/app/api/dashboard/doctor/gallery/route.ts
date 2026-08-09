import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const gallery = await db.doctorGallery.findMany({
      where: { doctorId: doctor.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ gallery })
  } catch (error) {
    console.error('Doctor gallery error:', error)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const photo = await db.doctorGallery.create({
      data: {
        doctorId: doctor.id,
        image,
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Add gallery photo error:', error)
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    await db.doctorGallery.deleteMany({
      where: { id, doctorId: doctor.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete gallery photo error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
