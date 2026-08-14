import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const paymentMethod = searchParams.get('paymentMethod') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where: Prisma.OpdBillWhereInput = {}

    if (paymentMethod) {
      where.paymentMethod = paymentMethod
    }

    if (search) {
      where.booking = {
        patientName: { contains: search, mode: 'insensitive' },
      }
    }

    const [bills, total] = await Promise.all([
      db.opdBill.findMany({
        where,
        include: {
          hospital: { select: { hospitalName: true } },
          booking: {
            select: {
              patientName: true,
              doctor: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.opdBill.count({ where }),
    ])

    return NextResponse.json({
      bills: bills.map((b) => ({
        id: b.id,
        receiptNo: b.receiptNo,
        patientName: b.booking.patientName,
        doctorName: b.booking.doctor.name,
        hospitalName: b.hospital.hospitalName,
        consultationFee: b.consultationFee,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod,
        paymentDate: b.paymentDate.toISOString(),
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin OPD bills error:', error)
    return NextResponse.json({ error: 'Failed to load OPD bills' }, { status: 500 })
  }
}
