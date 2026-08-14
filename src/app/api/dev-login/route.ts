import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Fallback dev users (mirrors api-auth.ts DEV_USERS)
const DEV_USERS: Record<string, { id: string; name: string; email: string; role: string; gender: string; profileImg: string | null; mobileNo: string | null }> = {
  patient: {
    id: 'dev-patient', name: 'Rahul Verma', email: 'rahul.v@doctorooms.com',
    role: 'patient', gender: 'Male', profileImg: null, mobileNo: '+91 9876543210',
  },
  doctor: {
    id: 'dev-doctor', name: 'Dr. Rajesh Sharma', email: 'rajesh.sharma@doctorooms.com',
    role: 'doctor', gender: 'Male', profileImg: null, mobileNo: '+91 9876543211',
  },
  receptionist: {
    id: 'dev-receptionist', name: 'Meera Joshi', email: 'meera.joshi@doctorooms.com',
    role: 'receptionist', gender: 'Female', profileImg: null, mobileNo: '+91 9876543212',
  },
  hospital: {
    id: 'dev-hospital', name: 'City General Hospital', email: 'city.hospital@doctorooms.com',
    role: 'hospital', gender: 'Male', profileImg: null, mobileNo: '+91 9876543213',
  },
  assistant: {
    id: 'dev-assistant', name: 'Vikram Patel', email: 'vikram.p@doctorooms.com',
    role: 'assistant', gender: 'Male', profileImg: null, mobileNo: '+91 9876543214',
  },
  pharmacist: {
    id: 'dev-pharmacist', name: 'Kavitha Devi', email: 'kavitha.d@doctorooms.com',
    role: 'pharmacist', gender: 'Female', profileImg: null, mobileNo: '+91 9876543215',
  },
  nurse: {
    id: 'dev-nurse', name: 'Priya Sharma', email: 'priya.sharma@doctorooms.com',
    role: 'nurse', gender: 'Female', profileImg: null, mobileNo: '+91 9876543217',
  },
  lab_technician: {
    id: 'dev-lab-tech', name: 'Amit Lab Tech', email: 'lab@doctorooms.com',
    role: 'lab_technician', gender: 'Male', profileImg: null, mobileNo: '+91 9876543218',
  },
  admin: {
    id: 'dev-admin', name: 'Admin User', email: 'admin@doctorooms.com',
    role: 'admin', gender: 'Male', profileImg: null, mobileNo: '+91 9876543216',
  },
};

/**
 * Dev-only login endpoint. Tries DB first, falls back to hardcoded dev users.
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

    // Try to find a real DB user with this role
    let user = await db.user.findFirst({
      where: { role, status: 'Active' },
    }).catch(() => null);

    // Fallback to dev user if no DB user exists
    const devUser = DEV_USERS[role];
    if (!user && !devUser) {
      return NextResponse.json(
        { success: false, message: `Unknown role: ${role}` },
        { status: 400 }
      );
    }

    const resolvedUser = user
      ? { id: user.id, name: user.name, email: user.email, role: user.role, gender: user.gender, profileImg: user.profileImg, mobileNo: user.mobileNo }
      : devUser!;

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
