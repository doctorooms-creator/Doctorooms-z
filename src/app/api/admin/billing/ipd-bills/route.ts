import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where: Prisma.IpdBillWhereInput = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.admission = {
        patientName: { contains: search, mode: 'insensitive' },
      }
    }

    const [bills, total] = await Promise.all([
      db.ipdBill.findMany({
        where,
        include: {
          hospital: { select: { hospitalName: true } },
          admission: { select: { patientName: true, admissionNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.ipdBill.count({ where }),
    ])

    return NextResponse.json({
      bills: bills.map((b) => ({
        id: b.id,
        billNo: b.billNo,
        patientName: b.admission.patientName,
        admissionNo: b.admission.admissionNo,
        totalAmount: b.totalAmount,
        netPayable: b.netPayable,
        status: b.status,
        generatedAt: b.generatedAt?.toISOString() || null,
        finalizedAt: b.finalizedAt?.toISOString() || null,
        hospitalName: b.hospital.hospitalName,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin IPD bills error:', error)
    return NextResponse.json({ error: 'Failed to load IPD bills' }, { status: 500 })
  }
}
