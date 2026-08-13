import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await requireRole(request, 'admin')
    const { id, userId } = await params

    // Verify hospital exists
    const hospital = await db.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    // Find the user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete the role-specific profile record based on user's role
    switch (user.role) {
      case 'receptionist': {
        const profile = await db.receptionist.findUnique({ where: { userId } })
        if (profile && profile.hospitalId === id) {
          await db.receptionist.delete({ where: { userId } })
        } else {
          return NextResponse.json({ error: 'Receptionist not found in this hospital' }, { status: 404 })
        }
        break
      }

      case 'pharmacist': {
        const profile = await db.doctorPharmacist.findUnique({ where: { userId } })
        if (profile && profile.hospitalId === id) {
          await db.doctorPharmacist.delete({ where: { userId } })
        } else {
          return NextResponse.json({ error: 'Pharmacist not found in this hospital' }, { status: 404 })
        }
        break
      }

      case 'assistant': {
        const profile = await db.doctorAssistant.findUnique({ where: { userId } })
        if (profile) {
          // Verify the assistant's doctor is linked to this hospital
          const doctorLink = await db.doctorHospital.findFirst({
            where: { doctorId: profile.doctorId, hospitalId: id },
          })
          if (!doctorLink) {
            return NextResponse.json({ error: 'Assistant not found in this hospital' }, { status: 404 })
          }
          await db.doctorAssistant.delete({ where: { userId } })
        } else {
          return NextResponse.json({ error: 'Assistant profile not found' }, { status: 404 })
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Cannot remove this role from hospital staff' }, { status: 400 })
    }

    // Deactivate the user (don't delete)
    await db.user.update({
      where: { id: userId },
      data: { status: 'Block' },
    })

    return NextResponse.json({ success: true, message: 'Staff removed and deactivated' })
  } catch (error) {
    console.error('Remove hospital staff error:', error)
    return NextResponse.json({ error: 'Failed to remove staff' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await requireRole(request, 'admin')
    const { id, userId } = await params

    // Verify hospital exists
    const hospital = await db.hospital.findUnique({ where: { id } })
    if (!hospital) {
      return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['Active', 'Block'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Active or Block' }, { status: 400 })
    }

    // Find the user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { status },
    })

    return NextResponse.json({
      success: true,
      user: {
        userId: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        gender: updated.gender,
        mobileNo: updated.mobileNo,
        profileImg: updated.profileImg,
      },
    })
  } catch (error) {
    console.error('Update staff status error:', error)
    return NextResponse.json({ error: 'Failed to update staff status' }, { status: 500 })
  }
}
