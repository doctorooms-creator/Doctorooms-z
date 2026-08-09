'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Users,
  Calendar,
  Phone,
  User,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Patient {
  userId: string
  name: string
  img: string
  gender: string
  mobile: string
  totalVisits: number
  lastVisit: string | null
}

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearch = (value: string) => {
    setSearch(value)
    setTimeout(() => setDebouncedSearch(value), 300)
  }

  const { data, isLoading } = useQuery<{ patients: Patient[] }>({
    queryKey: ['doctor-patients', debouncedSearch],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/patients?search=${encodeURIComponent(debouncedSearch)}`).then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search patients by name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.patients?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">No patients found</p>
          <p className="text-sm mt-1">Patients will appear here once they book appointments with you.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.patients.map((patient, i) => (
            <motion.div
              key={patient.userId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/dashboard/doctor/patients/${patient.userId}`}>
                <Card className="group transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={patient.img || ''} />
                        <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {patient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {patient.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {patient.gender && <span>{patient.gender}</span>}
                          {patient.mobile && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="h-3 w-3" /> {patient.mobile}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <User className="mr-1 h-3 w-3" /> {patient.totalVisits} visit{patient.totalVisits !== 1 ? 's' : ''}
                      </Badge>
                      {patient.lastVisit && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="mr-1 h-3 w-3" /> {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
