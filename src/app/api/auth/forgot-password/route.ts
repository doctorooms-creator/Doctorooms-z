import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email' },
        { status: 404 }
      );
    }

    const otp = generateOTP(email.toLowerCase());
    // In production, send OTP via email/SMS. For demo, return it.
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email',
      otp, // Only for demo purposes
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
