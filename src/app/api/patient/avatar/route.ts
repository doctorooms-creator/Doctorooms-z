import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { uploadToStorage, deleteFromStorage } from '@/lib/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const BUCKET = 'avatars'

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized access.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided. Please select an image.' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum allowed size is 2MB.' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const storagePath = `patients/${user.id}_${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const publicUrl = await uploadToStorage(BUCKET, storagePath, buffer, file.type)

    // Delete old avatar from storage if it's a Supabase URL and not default
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { profileImg: true },
    })

    if (existingUser?.profileImg && existingUser.profileImg !== 'default.png') {
      try {
        await deleteFromStorage(BUCKET, existingUser.profileImg)
      } catch {
        // Ignore if old file cannot be deleted (might be local)
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: { profileImg: publicUrl },
    })

    return NextResponse.json({
      success: true,
      profileImg: publicUrl,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to upload avatar. Please try again.' },
      { status: 500 }
    )
  }
}
