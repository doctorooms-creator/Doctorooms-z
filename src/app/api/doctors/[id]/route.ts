import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const user = await db.user.findUnique({
      where: { id, role: 'doctor', status: 'Active' },
      include: {
        doctor: true,
      },
    })

    if (!user || !user.doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Get schedules
    const schedules = await db.doctorSchedule.findMany({
      where: { doctorId: user.doctor.id },
      orderBy: { day: 'asc' },
    })

    // Get rating aggregates
    const ratingAgg = await db.doctorRating.aggregate({
      where: { doctorId: user.id },
      _avg: { star: true },
      _count: { star: true },
    })

    // Get related doctors (same specialization, different doctor)
    let relatedDoctors: { id: string; name: string; profileImg: string; doctor: { specialization: string; city: string; fees: number } | null }[] = []
    if (user.doctor.specialization) {
      relatedDoctors = await db.user
        .findMany({
          where: {
            role: 'doctor',
            status: 'Active',
            id: { not: user.id },
            doctor: {
              specialization: user.doctor.specialization,
            },
          },
          take: 5,
          select: {
            id: true,
            name: true,
            profileImg: true,
            doctor: {
              select: {
                specialization: true,
                city: true,
                fees: true,
              },
            },
          },
        })
    }

    return NextResponse.json({
      doctor: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImg: user.profileImg,
        gender: user.gender,
        createdAt: user.createdAt,
        doctor: {
          specialization: user.doctor.specialization,
          education: user.doctor.education,
          experience: user.doctor.experience,
          city: user.doctor.city,
          address: user.doctor.address,
          state: user.doctor.state,
          fees: user.doctor.fees,
          emergencyCharge: user.doctor.emergencyCharge,
          description: user.doctor.description,
          contactNo: user.doctor.contactNo,
          phoneNo: user.doctor.phoneNo,
          isEmergency: user.doctor.isEmergency,
          awardAndRecognition: user.doctor.awardAndRecognition,
        },
        schedules,
        avgRating: ratingAgg._avg.star || 0,
        ratingCount: ratingAgg._count.star || 0,
        patientCount: await db.booking.count({ where: { doctorId: user.doctor.id, status: { in: ['Approve', 'Visited', 'Finish'] } } }),
        relatedDoctors,
      },
    })
  } catch (error) {
    console.error('Doctor detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch doctor' }, { status: 500 })
  }
}
