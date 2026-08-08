import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isOtpVerified, clearOtp } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!isOtpVerified(email.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Please verify your OTP first' },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashed },
    });

    clearOtp(email.toLowerCase());

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
