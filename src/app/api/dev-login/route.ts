import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Dev-only login endpoint. Accepts a role, finds a real DB user with that role,
 * sets proper httpOnly cookies, and returns the user object.
 * 
 * This allows the role-selector login page to work without password auth.
 */
export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role is required' },
        { status: 400 }
      );
    }

    // Find a real user with this role from the DB
    const user = await db.user.findFirst({
      where: { role, status: 'Active' },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: `No active ${role} user found in database` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        profileImg: user.profileImg,
        mobileNo: user.mobileNo,
      },
    });

    // Set proper httpOnly cookies (same as real login)
    response.cookies.set('doctorooms_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('doctorooms_role', user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
