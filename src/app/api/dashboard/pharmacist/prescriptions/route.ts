import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'pharmacist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: session.user.id },
    })

    if (!pharmacist) {
      return NextResponse.json({ error: 'Pharmacist not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = { doctorId: pharmacist.doctorId }
    if (search) {
      where.patientName = { contains: search }
    }

    const prescriptions = await db.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        medicines: true,
        labels: true,
      },
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Pharmacist prescriptions error:', error)
    return NextResponse.json({ error: 'Failed to load prescriptions' }, { status: 500 })
  }
}
