import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, DEV_USERS } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (user) {
      return NextResponse.json({ success: true, user });
    }

    // DEV_MODE fallback: check role cookie directly
    if (process.env.NODE_ENV !== 'production') {
      const roleCookie = req.cookies.get('doctorooms_role')?.value;
      if (roleCookie && DEV_USERS[roleCookie]) {
        return NextResponse.json({ success: true, user: DEV_USERS[roleCookie] });
      }
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
