import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'receptionist')

    const receptionist = await db.receptionist.findUnique({
      where: { userId: user.id },
      select: { doctorId: true, hospitalId: true },
    })

    if (!receptionist) {
      return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 })
    }

    // ── Hospital Mode: show ALL hospital doctors' schedules, grouped by department ──
    const isHospitalMode = !!receptionist.hospitalId && !receptionist.doctorId

    if (isHospitalMode) {
      const { searchParams } = new URL(req.url)
      const queryDepartmentId = searchParams.get('departmentId') || ''

      // Get all doctor links for this hospital
      const doctorLinks = await db.doctorHospital.findMany({
        where: {
          hospitalId: receptionist.hospitalId,
          status: 'Active',
          ...(queryDepartmentId ? { departmentId: queryDepartmentId } : {}),
        },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, profileImg: true, id: true } },
              schedules: { orderBy: { createdAt: 'asc' } },
            },
          },
          department: { select: { id: true, name: true, shortCode: true, icon: true } },
        },
        orderBy: [{ department: { sortOrder: 'asc' } }, { doctor: { user: { name: 'asc' } } }],
      })

      // Get holidays for all hospital doctors
      const doctorUserIds = doctorLinks.map((dl) => dl.doctor.userId)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const holidays = await db.doctorHoliday.findMany({
        where: {
          userId: { in: doctorUserIds },
          date: { gte: today },
        },
        orderBy: { date: 'asc' },
        take: 90,
      })

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

      // Group doctors by department
      const departmentGroups: Record<string, {
        department: { id: string; name: string; shortCode: string; icon: string }
        doctors: Array<{
          id: string
          name: string
          profileImg: string | null
          specialization: string
          designation: string
          fees: number
          schedules: Array<{ day: string; startTime: string; endTime: string; slotDuration: number; timeSlots: string[] } | null>
        }>
      }> = {}

      for (const link of doctorLinks) {
        const deptId = link.department.id
        if (!departmentGroups[deptId]) {
          departmentGroups[deptId] = {
            department: link.department,
            doctors: [],
          }
        }

        const scheduleMap: Record<string, { day: string; startTime: string; endTime: string; slotDuration: number; timeSlots: string[] } | null> = {}
        for (const s of link.doctor.schedules) {
          const slots = s.timeSlots ? JSON.parse(s.timeSlots) as string[] : []
          scheduleMap[s.day] = {
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration,
            timeSlots: slots,
          }
        }

        departmentGroups[deptId].doctors.push({
          id: link.doctor.id,
          name: link.doctor.user.name,
          profileImg: link.doctor.user.profileImg,
          specialization: link.doctor.specialization,
          designation: link.designation,
          fees: link.fees,
          schedules: days.map((day) => scheduleMap[day] || null),
        })
      }

      return NextResponse.json({
        isHospitalMode: true,
        departments: Object.values(departmentGroups),
        holidays: holidays.map((h) => ({
          id: h.id,
          doctorUserId: h.userId,
          date: h.date.toISOString(),
          remark: h.remark,
        })),
        todayName,
      })
    }

    // ── Clinic Mode (unchanged) ──
    const doctor = await db.doctor.findUnique({
      where: { id: receptionist.doctorId },
      include: {
        user: { select: { name: true, profileImg: true, id: true } },
        schedules: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Fetch upcoming holidays (from today onwards)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const holidays = await db.doctorHoliday.findMany({
      where: {
        userId: doctor.userId,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 30,
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Build schedule map
    const scheduleMap: Record<string, { day: string; startTime: string; endTime: string; slotDuration: number; timeSlots: string[] } | null> = {}
    for (const s of doctor.schedules) {
      const slots = s.timeSlots ? JSON.parse(s.timeSlots) as string[] : []
      scheduleMap[s.day] = {
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        slotDuration: s.slotDuration,
        timeSlots: slots,
      }
    }

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    return NextResponse.json({
      isHospitalMode: false,
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        profileImg: doctor.user.profileImg,
        specialization: doctor.specialization,
      },
      schedules: days.map((day) => scheduleMap[day] || null),
      holidays: holidays.map((h) => ({
        id: h.id,
        date: h.date.toISOString(),
        remark: h.remark,
      })),
      todayName,
    })
  } catch (error) {
    console.error('Receptionist schedule error:', error)
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 })
  }
}
