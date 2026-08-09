'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Users, Calendar, Mail, Phone, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Patient {
  id: string
  name: string
  email: string
  mobileNo: string
  profileImg: string | null
  gender: string
  status: string
  visitCount: number
  lastVisit: string | null
  createdAt: string
}

const genderIcons: Record<string, string> = {
  Male: '♂',
  Female: '♀',
  Other: '⚧',
}

export default function ReceptionistPatientsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery<{ patients: Patient[] }>({
    queryKey: ['receptionist-patients', debouncedSearch],
    queryFn: () =>
      fetch(
        `/api/dashboard/receptionist/patients?search=${encodeURIComponent(debouncedSearch)}`
      ).then((r) => r.json()),
  })

  const patients = data?.patients ?? []

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {patients.length} patient{patients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Patient cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search
                ? 'No patients match your search'
                : 'No patients for this doctor yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient, i) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={patient.profileImg || ''} />
                        <AvatarFallback className="text-sm bg-teal-100 dark:bg-teal-900/50">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">
                        {genderIcons[patient.gender] || ''}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{patient.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {patient.email || patient.mobileNo || 'No contact info'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {/* Visit count */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-teal-500" />
                      <span className="font-medium">{patient.visitCount}</span>
                      <span className="text-muted-foreground">
                        visit{patient.visitCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Last visit */}
                    {patient.lastVisit && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Last: {format(new Date(patient.lastVisit), 'MMM d, yyyy')}</span>
                      </div>
                    )}

                    {/* Contact details */}
                    {patient.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}

                    {patient.mobileNo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{patient.mobileNo}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[10px] text-muted-foreground">
                      Joined {format(new Date(patient.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        patient.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          : patient.status === 'Block'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      )}
                    >
                      {patient.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
