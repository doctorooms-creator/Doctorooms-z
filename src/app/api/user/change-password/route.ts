import { NextRequest, NextResponse } from 'next/server'
import { compare, hash } from 'bcryptjs'
import { requireAuth } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Fetch the user with password field
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    })

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isMatch = await compare(currentPassword, dbUser.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash and update the new password
    const hashedPassword = await hash(newPassword, 10)
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
