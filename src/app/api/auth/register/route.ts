import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, mobileNo, gender, password, role } = body;

    // Security: Only allow self-registration for patient and hospital roles.
    // Privileged roles (admin, doctor, receptionist, assistant, pharmacist) must be
    // assigned by an admin through the dashboard, not through public registration.
    const ALLOWED_SELF_REGISTER_ROLES = ['patient', 'hospital'];
    const safeRole = ALLOWED_SELF_REGISTER_ROLES.includes(role) ? role : 'patient';

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        mobileNo: mobileNo || '',
        gender: gender || 'Male',
        role: safeRole,
        status: 'Active',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
