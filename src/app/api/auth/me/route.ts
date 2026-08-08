import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Try cookie-based auth first
    const sessionId = req.cookies.get('doctorooms_session')?.value;
    if (sessionId) {
      const user = await db.user.findUnique({ where: { id: sessionId } });
      if (user && user.status === 'Active') {
        return NextResponse.json({
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
      }
    }

    // Try NextAuth session as fallback
    const nextAuthSession = req.cookies.get('next-auth.session-token')?.value;
    if (nextAuthSession) {
      // Just return that user is authenticated via NextAuth
      // The client will have session data from the login response
      return NextResponse.json({ success: true, viaNextAuth: true });
    }

    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
