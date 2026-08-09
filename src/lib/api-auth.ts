import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  gender: string | null
  profileImg: string | null
  mobileNo: string | null
}

/**
 * Unified auth for API routes.
 * DEV MODE: If DB lookup fails, falls back to creating a mock user
 * from the doctorooms_role cookie. Auth is disabled for development.
 *
 * PRODUCTION: Will require valid session cookie + DB user lookup.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const sessionId = req.cookies.get('doctorooms_session')?.value
  const roleCookie = req.cookies.get('doctorooms_role')?.value

  // Try real DB lookup first
  if (sessionId) {
    try {
      const user = await db.user.findUnique({
        where: { id: sessionId },
      })

      if (user && user.status === 'Active') {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          gender: user.gender,
          profileImg: user.profileImg,
          mobileNo: user.mobileNo,
        }
      }
    } catch {
      // DB lookup failed, fall through to dev mode
    }
  }

  // DEV MODE FALLBACK: Create mock user from role cookie
  // This allows all API routes to work without real authentication
  if (roleCookie) {
    return getDevUser(roleCookie, sessionId)
  }

  return null
}

/** Require auth + specific role. Returns user or null. */
export async function requireRole(req: NextRequest, role: string): Promise<AuthUser | null> {
  const user = await getAuthUser(req)
  if (!user) return null

  // In dev mode, accept any role match (case-insensitive)
  if (user.role.toLowerCase() === role.toLowerCase()) return user

  // Also allow admin to access any role's routes in dev mode
  if (user.role === 'admin') return user

  return null
}

/** Require auth (any role). Returns user or null. */
export async function requireAuth(req: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(req)
}

/** Roles that can access reception-level booking management */
export const RECEPTION_ROLES = ['receptionist', 'hospital', 'admin']

// ─── Dev Mode Helpers ──────────────────────────────────────────────

const DEV_USERS: Record<string, AuthUser> = {
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
}

function getDevUser(role: string, id?: string | null): AuthUser {
  const base = DEV_USERS[role] || DEV_USERS['patient']!
  // If a real session ID exists, try to use it for data queries
  if (id && !id.startsWith('dev-')) {
    return { ...base, id }
  }
  return base
}
