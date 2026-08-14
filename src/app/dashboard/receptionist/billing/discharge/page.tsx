import { requireRole } from '@/lib/api-auth'
import { cookies } from 'next/headers'
import ReceptionistDischargeClient from './client'

export const dynamic = 'force-dynamic'

export default async function ReceptionistDischargePage() {
  const req = new Request('http://localhost', { headers: { cookie: (await cookies()).toString() } })
  const user = await requireRole(req, 'receptionist')

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Receptionist role required.</p>
      </div>
    )
  }

  return <ReceptionistDischargeClient user={user} />
}