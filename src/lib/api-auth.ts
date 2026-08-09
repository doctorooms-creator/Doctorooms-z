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
 * Reads the `doctorooms_session` cookie (set by /api/auth/login)
 * and returns the full User record from DB.
 *
 * All new API routes MUST use this instead of getServerSession,
 * because the login flow sets a custom cookie, not a NextAuth JWT.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const sessionId = req.cookies.get('doctorooms_session')?.value
  if (!sessionId) return null

  const user = await db.user.findUnique({
    where: { id: sessionId },
  })

  if (!user || user.status !== 'Active') return null

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

/** Require auth + specific role. Returns user or null. */
export async function requireRole(req: NextRequest, role: string): Promise<AuthUser | null> {
  const user = await getAuthUser(req)
  if (!user || user.role !== role) return null
  return user
}

/** Require auth (any role). Returns user or null. */
export async function requireAuth(req: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(req)
}

/** Roles that can access reception-level booking management */
export const RECEPTION_ROLES = ['receptionist', 'hospital', 'admin']
