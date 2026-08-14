import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/api-auth'

// GET /api/bed-transfers/history — Get bed transfer history with filters
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined
    const hospitalId = searchParams.get('hospitalId') || undefined
    const admissionId = searchParams.get('admissionId') || undefined

    const where: Record<string, unknown> = {}

    if (fromDate || toDate) {
      const dateFilter: Record<string, unknown> = {}
      if (fromDate) dateFilter.gte = new Date(fromDate)
      if (toDate) dateFilter.lte = new Date(toDate + 'T23:59:59.999Z')
      where.createdAt = dateFilter
    }

    if (admissionId) where.admissionId = admissionId

    // If hospitalId filter, filter via admission
    if (hospitalId) {
      where.admission = { hospitalId }
    }

    const transfers = await db.bedTransfer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        fromBed: {
          select: {
            bedNumber: true,
            bedType: true,
            ward: { select: { name: true } },
          },
        },
        toBed: {
          select: {
            bedNumber: true,
            bedType: true,
            ward: { select: { name: true } },
          },
        },
        admission: {
          select: {
            id: true,
            patientName: true,
            admissionNo: true,
          },
        },
      },
    })

    // Fetch user names for transferredBy
    const userIds = [...new Set(transfers.map((t) => t.transferredBy))]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })
    const userMap = new Map(users.map((u) => [u.id, u.name]))

    return NextResponse.json({
      transfers: transfers.map((t) => ({
        id: t.id,
        admissionId: t.admissionId,
        fromBedId: t.fromBedId,
        fromBed: t.fromBed
          ? {
              bedNumber: t.fromBed.bedNumber,
              bedType: t.fromBed.bedType,
              wardName: t.fromBed.ward?.name || '',
            }
          : null,
        toBedId: t.toBedId,
        toBed: t.toBed
          ? {
              bedNumber: t.toBed.bedNumber,
              bedType: t.toBed.bedType,
              wardName: t.toBed.ward?.name || '',
            }
          : null,
        transferDate: t.transferDate,
        transferReason: t.transferReason,
        transferredBy: t.transferredBy,
        transferredByName: userMap.get(t.transferredBy) || 'Unknown',
        admission: t.admission
          ? {
              id: t.admission.id,
              patientName: t.admission.patientName,
              admissionNo: t.admission.admissionNo,
            }
          : null,
        createdAt: t.createdAt,
      })),
    })
  } catch (error) {
    console.error('Bed transfer history GET error:', error)
    return NextResponse.json({ error: 'Failed to load bed transfer history' }, { status: 500 })
  }
}
