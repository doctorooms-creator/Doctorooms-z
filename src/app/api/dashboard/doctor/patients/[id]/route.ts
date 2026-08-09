import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { differenceInYears, parseISO } from 'date-fns'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: patientUserId } = await params

    // Find the doctor record for this user
    const doctor = await db.doctor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    // Get patient basic info
    const patient = await db.user.findUnique({
      where: { id: patientUserId },
      select: {
        id: true,
        name: true,
        gender: true,
        email: true,
        mobileNo: true,
        profileImg: true,
        createdAt: true,
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Get all bookings for this patient with this doctor
    const bookings = await db.booking.findMany({
      where: {
        doctorId: doctor.id,
        userId: patientUserId,
      },
      orderBy: { bookingDate: 'desc' },
      include: {
        prescriptions: {
          include: {
            medicines: true,
            labels: true,
            suggestions: true,
          },
        },
      },
    })

    // Calculate age from most recent booking's dateOfBirth
    let age: number | null = null
    const latestBooking = bookings[0]
    if (latestBooking?.dateOfBirth) {
      age = differenceInYears(new Date(), new Date(latestBooking.dateOfBirth))
    } else if (patient.createdAt) {
      // Fallback: no DOB known
      age = null
    }

    // Get blood group from latest booking
    const bloodGroup = latestBooking?.bloodGroup || ''

    // Build visit history
    const visitHistory = bookings.map((b) => ({
      id: b.id,
      appointmentNo: b.appointmentNo,
      bookingDate: b.bookingDate.toISOString(),
      disease: b.disease,
      description: b.description,
      status: b.status,
      timeSlot: b.timeSlot,
      bookingMode: b.bookingMode,
      bloodGroup: b.bloodGroup,
      weight: b.weight,
      height: b.height,
      prescriptions: b.prescriptions.map((p) => ({
        id: p.id,
        disease: p.disease,
        weight: p.weight,
        bp: p.bp,
        temperature: p.temperature,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
        medicines: p.medicines.map((m) => ({
          id: m.id,
          medicine: m.medicine,
          morning: m.morning,
          afternoon: m.afternoon,
          evening: m.evening,
          tab: m.tab,
          dose: m.dose,
          description: m.description,
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
      })),
    }))

    // Calculate stats
    const totalVisits = bookings.length
    const lastVisit = bookings.length > 0 ? bookings[0].bookingDate.toISOString() : null

    // Common diseases (top 3)
    const diseaseCounts: Record<string, number> = {}
    for (const b of bookings) {
      const d = b.disease.trim()
      if (d) {
        diseaseCounts[d] = (diseaseCounts[d] || 0) + 1
      }
    }
    const commonDiseases = Object.entries(diseaseCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([disease, count]) => ({ disease, count }))

    return NextResponse.json({
      patient: {
        name: patient.name,
        gender: patient.gender,
        email: patient.email,
        mobileNo: patient.mobileNo,
        profileImg: patient.profileImg,
        dateOfBirth: latestBooking?.dateOfBirth?.toISOString() || null,
        createdAt: patient.createdAt.toISOString(),
        age,
        bloodGroup,
      },
      visitHistory,
      stats: {
        totalVisits,
        lastVisit,
        commonDiseases,
      },
    })
  } catch (error) {
    console.error('Patient detail error:', error)
    return NextResponse.json({ error: 'Failed to load patient details' }, { status: 500 })
  }
}
