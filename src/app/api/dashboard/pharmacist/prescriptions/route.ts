import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'pharmacist')

    const pharmacist = await db.doctorPharmacist.findUnique({
      where: { userId: user.id },
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
