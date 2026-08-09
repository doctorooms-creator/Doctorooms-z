import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEV_USERS: Record<string, any> = {
  patient: {
    id: 'dev-patient',
    name: 'Rahul Verma',
    email: 'rahul.v@doctorooms.com',
    role: 'patient',
    gender: 'Male',
    profileImg: null,
    mobileNo: '+91 9876543210',
  },
  doctor: {
    id: 'dev-doctor',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@doctorooms.com',
    role: 'doctor',
    gender: 'Male',
    profileImg: null,
    mobileNo: '+91 9876543211',
  },
  receptionist: {
    id: 'dev-receptionist',
    name: 'Meera Joshi',
    email: 'meera.joshi@doctorooms.com',
    role: 'receptionist',
    gender: 'Female',
    profileImg: null,
    mobileNo: '+91 9876543212',
  },
  hospital: {
    id: 'dev-hospital',
    name: 'City General Hospital',
    email: 'city.hospital@doctorooms.com',
    role: 'hospital',
    gender: 'Male',
    profileImg: null,
    mobileNo: '+91 9876543213',
  },
  assistant: {
    id: 'dev-assistant',
    name: 'Vikram Patel',
    email: 'vikram.p@doctorooms.com',
    role: 'assistant',
    gender: 'Male',
    profileImg: null,
    mobileNo: '+91 9876543214',
  },
  pharmacist: {
    id: 'dev-pharmacist',
    name: 'Kavitha Devi',
    email: 'kavitha.d@doctorooms.com',
    role: 'pharmacist',
    gender: 'Female',
    profileImg: null,
    mobileNo: '+91 9876543215',
  },
  admin: {
    id: 'dev-admin',
    name: 'Admin User',
    email: 'admin@doctorooms.com',
    role: 'admin',
    gender: 'Male',
    profileImg: null,
    mobileNo: '+91 9876543216',
  },
};

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('doctorooms_session')?.value;
    const roleCookie = req.cookies.get('doctorooms_role')?.value;

    // Try real DB lookup first
    if (sessionId) {
      try {
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
      } catch {
        // DB failed, fall through to dev mode
      }
    }

    // DEV MODE: Return mock user from role cookie
    if (roleCookie && DEV_USERS[roleCookie]) {
      const devUser = DEV_USERS[roleCookie];
      // If session is a real DB ID (not dev-), use it for data queries
      if (sessionId && !sessionId.startsWith('dev-')) {
        return NextResponse.json({
          success: true,
          user: { ...devUser, id: sessionId },
        });
      }
      return NextResponse.json({ success: true, user: devUser });
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
