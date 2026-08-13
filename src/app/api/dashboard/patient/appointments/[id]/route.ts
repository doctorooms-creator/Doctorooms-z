import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { resolveAvatarUrl } from '@/lib/avatar-url'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, profileImg: true, email: true, mobileNo: true } },
          },
        },
        user: { select: { name: true, email: true, mobileNo: true, gender: true, profileImg: true } },
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, profileImg: true, role: true } },
          },
        },
        prescriptions: {
          include: {
            medicines: true,
            labels: true,
            suggestions: true,
          },
        },
      },
    })

    if (!booking || booking.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const statusTimeline = [
      { status: 'Pending', label: 'Appointment Booked', date: booking.createdAt },
    ]

    if (['Approve', 'Visited', 'Finish'].includes(booking.status)) {
      statusTimeline.push({
        status: 'Approve',
        label: 'Approved by Doctor',
        date: booking.updatedAt > booking.createdAt ? booking.updatedAt : booking.createdAt,
      })
    }
    if (['Visited', 'Finish'].includes(booking.status)) {
      statusTimeline.push({
        status: 'Visited',
        label: 'Consultation Completed',
        date: booking.updatedAt,
      })
    }
    if (booking.status === 'Finish') {
      statusTimeline.push({
        status: 'Finish',
        label: 'Appointment Finished',
        date: booking.updatedAt,
      })
    }
    if (booking.status === 'Canceled') {
      statusTimeline.push({
        status: 'Canceled',
        label: 'Appointment Canceled',
        date: booking.updatedAt,
      })
    }

    return NextResponse.json({
      appointment: {
        id: booking.id,
        appointmentNo: booking.appointmentNo,
        bookingDate: booking.bookingDate,
        patientName: booking.patientName || booking.user?.name || '',
        disease: booking.disease,
        description: booking.description,
        gender: booking.gender || booking.user?.gender || '',
        bloodGroup: booking.bloodGroup,
        age: booking.age,
        weight: booking.weight,
        height: booking.height,
        status: booking.status,
        doctorId: booking.doctorId,
        charge: booking.appointmentCharge,
        bookingType: booking.bookingType,
        bookingMode: booking.bookingMode,
        videoRoomId: booking.videoRoomId,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
      doctor: booking.doctor
        ? {
            id: booking.doctor.id,
            userId: booking.doctor.userId,
            name: booking.doctor.user?.name || '',
            img: resolveAvatarUrl(booking.doctor.user?.profileImg),
            email: booking.doctor.user?.email || '',
            phone: booking.doctor.user?.mobileNo || '',
            specialization: booking.doctor.specialization,
            city: booking.doctor.city,
            hospitalAddress: booking.doctor.hospitalAddress,
            fees: booking.doctor.fees,
            experience: booking.doctor.experience,
          }
        : null,
      patient: booking.user
        ? {
            name: booking.user.name,
            email: booking.user.email,
            phone: booking.user.mobileNo,
            gender: booking.user.gender,
            img: resolveAvatarUrl(booking.user.profileImg),
          }
        : null,
      chatMessages: booking.chatMessages.map((m) => ({
        id: m.id,
        fromId: m.fromId,
        message: m.message,
        status: m.status,
        createdAt: m.createdAt,
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          profileImg: resolveAvatarUrl(m.sender.profileImg),
          role: m.sender.role,
        },
      })),
      prescriptions: booking.prescriptions.map((p) => ({
        id: p.id,
        patientName: p.patientName,
        patientAge: p.patientAge,
        disease: p.disease,
        weight: p.weight,
        bp: p.bp,
        temperature: p.temperature,
        description: p.description,
        fulfillmentStatus: p.fulfillmentStatus,
        medicines: p.medicines.map((med) => ({
          id: med.id,
          medicine: med.medicine,
          morning: med.morning,
          afternoon: med.afternoon,
          evening: med.evening,
          tab: med.tab,
          dose: med.dose,
          description: med.description,
        })),
        labels: p.labels.map((l) => ({
          id: l.id,
          label: l.label,
          value: l.value,
          labelUnit: l.labelUnit,
        })),
        suggestions: p.suggestions.map((s) => ({
          id: s.id,
          question: s.question,
          suggestions: s.suggestions,
        })),
        createdAt: p.createdAt,
      })),
      statusTimeline,
      tokenNumber: booking.tokenNumber || null,
      tokenOrder: booking.tokenOrder || null,
      hospitalId: booking.hospitalId || null,
      departmentId: booking.departmentId || null,
    })
  } catch (error) {
    console.error('Appointment detail error:', error)
    return NextResponse.json({ error: 'Failed to load appointment' }, { status: 500 })
  }
}
