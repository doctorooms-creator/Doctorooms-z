import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Singleton: get or create
    let settings = await db.pOtherSetting.findUnique({
      where: { doctorId: doctor.id },
    })

    if (!settings) {
      settings = await db.pOtherSetting.create({
        data: {
          doctorId: doctor.id,
          createdById: user.id,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Print settings GET error:', error)
    return NextResponse.json({ error: 'Failed to load print settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Ensure record exists
    let settings = await db.pOtherSetting.findUnique({
      where: { doctorId: doctor.id },
    })
    if (!settings) {
      settings = await db.pOtherSetting.create({
        data: {
          doctorId: doctor.id,
          createdById: user.id,
        },
      })
    }

    const body = await req.json()
    const { logo, header, fullHeader, isFullHeader, footer, showCoInPrint, showNextVisit, printLayout } = body

    const updateData: Record<string, unknown> = {}
    if (logo !== undefined) updateData.logo = typeof logo === 'string' ? logo.trim() : ''
    if (header !== undefined) updateData.header = typeof header === 'string' ? header : ''
    if (fullHeader !== undefined) updateData.fullHeader = typeof fullHeader === 'string' ? fullHeader.trim() : ''
    if (isFullHeader !== undefined) updateData.isFullHeader = typeof isFullHeader === 'boolean' ? isFullHeader : false
    if (footer !== undefined) updateData.footer = typeof footer === 'string' ? footer : ''
    if (showCoInPrint !== undefined) updateData.showCoInPrint = typeof showCoInPrint === 'boolean' ? showCoInPrint : true
    if (showNextVisit !== undefined) updateData.showNextVisit = typeof showNextVisit === 'boolean' ? showNextVisit : true
    if (printLayout !== undefined) {
      const valid = ['standard', 'compact', 'detailed']
      updateData.printLayout = valid.includes(printLayout) ? printLayout : 'standard'
    }

    const updated = await db.pOtherSetting.update({
      where: { id: settings.id },
      data: updateData,
    })

    return NextResponse.json({ settings: updated })
  } catch (error) {
    console.error('Print settings PUT error:', error)
    return NextResponse.json({ error: 'Failed to update print settings' }, { status: 500 })
  }
}
