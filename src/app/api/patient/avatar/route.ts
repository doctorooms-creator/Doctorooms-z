import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profile');

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient');

    const formData = await req.formData();
    const file = formData.get('avatar') as File;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided. Please select an image.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum allowed size is 2MB.' },
        { status: 400 }
      );
    }

    // Extract extension from file name
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const newFilename = `${user.id}_${Date.now()}.${ext}`;

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = join(UPLOAD_DIR, newFilename);
    await writeFile(filePath, buffer);

    // Delete old avatar if it exists and is not the default
    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { profileImg: true },
    });

    if (existingUser?.profileImg && existingUser.profileImg !== 'default.png') {
      const oldFilePath = join(UPLOAD_DIR, existingUser.profileImg);
      if (existsSync(oldFilePath)) {
        try {
          unlinkSync(oldFilePath);
        } catch {
          // Ignore error if old file cannot be deleted
        }
      }
    }

    // Update database
    await db.user.update({
      where: { id: user.id },
      data: { profileImg: newFilename },
    });

    return NextResponse.json({
      success: true,
      profileImg: newFilename,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access.' },
        { status: 401 }
      );
    }
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload avatar. Please try again.' },
      { status: 500 }
    );
  }
}
