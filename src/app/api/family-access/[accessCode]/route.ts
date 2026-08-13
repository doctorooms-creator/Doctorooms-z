import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accessCode: string }> }
) {
  try {
    const { accessCode } = await params

    if (!accessCode || accessCode.length !== 6) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 400 })
    }

    const familyAccess = await db.familyAccess.findUnique({
      where: { accessCode },
      include: {
        admission: {
          include: {
            ward: { select: { name: true, wardType: true } },
            bed: { select: { bedNumber: true, bedType: true } },
            department: { select: { name: true } },
            attendingDoctor: {
              select: {
                user: { select: { name: true } },
              },
            },
            hospital: { select: { hospitalName: true, phone: true } },
          },
        },
      },
    })

    if (!familyAccess) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 404 })
    }

    if (!familyAccess.isActive) {
      return NextResponse.json({ error: 'This access code has been revoked' }, { status: 410 })
    }

    const admission = familyAccess.admission

    // Base response — no diagnosis, investigation details, doctor notes, or contact info
    const response: Record<string, unknown> = {
      patientName: familyAccess.patientName,
      ward: admission.ward?.name || '',
      wardType: admission.ward?.wardType || '',
      bed: admission.bed?.bedNumber || '',
      bedType: admission.bed?.bedType || '',
      department: admission.department?.name || '',
      attendingDoctor: admission.attendingDoctor?.user?.name || '',
      admitDate: admission.admissionDate,
      status: admission.status,
      hospitalName: admission.hospital?.hospitalName || '',
      hospitalPhone: admission.hospital?.phone || '',
      canViewVitals: familyAccess.canViewVitals,
      canViewDiet: familyAccess.canViewDiet,
      canViewBill: familyAccess.canViewBill,
    }

    // Vitals (if allowed)
    if (familyAccess.canViewVitals) {
      const vitals = await db.vitalRecord.findMany({
        where: { admissionId: familyAccess.admissionId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: {
          recordedAt: true,
          temperature: true,
          pulse: true,
          spo2: true,
          bpSystolic: true,
          bpDiastolic: true,
          respiratoryRate: true,
          patientStatus: true,
          oxygenLiters: true,
          remarks: true,
        },
      })
      response.vitals = vitals
    }

    // Diet orders (if allowed)
    if (familyAccess.canViewDiet) {
      const dietOrders = await db.dietOrder.findMany({
        where: {
          admissionId: familyAccess.admissionId,
          status: 'Active',
        },
        orderBy: { createdAt: 'desc' },
        select: {
          dietType: true,
          mealType: true,
          instructions: true,
          startDate: true,
          status: true,
        },
      })
      response.dietOrders = dietOrders
    }

    // Bill summary (if allowed)
    if (familyAccess.canViewBill) {
      const bill = await db.ipdBill.findUnique({
        where: { admissionId: familyAccess.admissionId },
        select: {
          billNo: true,
          roomRentAmount: true,
          serviceAmount: true,
          labAmount: true,
          medicineAmount: true,
          otAmount: true,
          otherAmount: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          totalAmount: true,
          advanceAdjusted: true,
          netPayable: true,
          status: true,
          generatedAt: true,
        },
      })
      if (bill) {
        response.bill = bill
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Family access lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
