import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEV_USERS, getDevUser } from '@/lib/api-auth';

/**
 * Dev-only login endpoint. Tries DB first, falls back to hardcoded dev users.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json(
        { success: false, message: 'Role is required' },
        { status: 400 }
      );
    }

    // Try to find a real DB user with this role
    let user = await db.user.findFirst({
      where: { role, status: 'Active' },
    }).catch(() => null);

    // Fallback to dev user if no DB user exists
    const devUser = getDevUser(role);
    if (!user && !DEV_USERS[role]) {
      return NextResponse.json(
        { success: false, message: `Unknown role: ${role}` },
        { status: 400 }
      );
    }

    const resolvedUser = user
      ? { id: user.id, name: user.name, email: user.email, role: user.role, gender: user.gender, profileImg: user.profileImg, mobileNo: user.mobileNo }
      : devUser;

    const response = NextResponse.json({
      success: true,
      user: resolvedUser,
    });

    // Set proper httpOnly cookies
    response.cookies.set('doctorooms_session', resolvedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('doctorooms_role', resolvedUser.role, {
      httpOnly: true,
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
