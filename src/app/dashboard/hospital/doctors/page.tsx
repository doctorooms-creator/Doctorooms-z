'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Stethoscope,
  Star,
  Search,
  CalendarDays,
  IndianRupee,
  GraduationCap,
  Clock,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HospitalDoctor {
  id: string
  userId: string
  name: string
  email: string
  profileImg: string | null
  specialization: string
  city: string
  fees: number
  status: string
  mobileNo: string
  experience: string
  education: string
  avgRating: number
  totalRatings: number
  totalAppointments: number
  createdAt: string
}

const doctorStatusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export default function HospitalDoctorsPage() {
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('all')

  const { data, isLoading } = useQuery<{
    doctors: HospitalDoctor[]
    specializations: string[]
  }>({
    queryKey: ['hospital-doctors', search, specFilter],
    queryFn: () =>
      fetch(
        `/api/dashboard/hospital/doctors?search=${encodeURIComponent(search)}&specialization=${specFilter}`
      ).then((r) => r.json()),
  })

  const doctors = data?.doctors ?? []
  const specializations = data?.specializations ?? []
  const activeCount = doctors.filter((d) => d.status === 'Active').length
  const pendingCount = doctors.filter((d) => d.status === 'Pending').length

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Doctors"
          value={doctors.length}
          icon={Stethoscope}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Active"
          value={activeCount}
          icon={GraduationCap}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {specializations.length > 0 && (
          <Select value={specFilter} onValueChange={setSpecFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {specializations.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Doctor cards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {search || specFilter !== 'all'
                ? 'No doctors match your filters'
                : 'No doctors linked to this hospital yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={doctor.profileImg || ''} />
                      <AvatarFallback className="text-lg bg-teal-100 dark:bg-teal-900/50">
                        {doctor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold">{doctor.name}</h3>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                            doctorStatusColors[doctor.status] || 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {doctor.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {doctor.specialization || 'General Physician'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {/* Rating */}
                    {doctor.avgRating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star
                              key={si}
                              className={cn(
                                'h-3.5 w-3.5',
                                si < Math.round(doctor.avgRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium">
                          {doctor.avgRating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({doctor.totalRatings})
                        </span>
                      </div>
                    )}

                    {/* Fees */}
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">₹{doctor.fees.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-muted-foreground">consultation</span>
                    </div>

                    {/* Appointments */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span>{doctor.totalAppointments} appointments</span>
                    </div>

                    {/* Experience & Education */}
                    {(doctor.experience || doctor.education) && (
                      <div className="pt-2 border-t border-border">
                        {doctor.experience && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Exp:</span> {doctor.experience}
                          </p>
                        )}
                        {doctor.education && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Edu:</span> {doctor.education}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Contact */}
                    {doctor.mobileNo && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{doctor.mobileNo}</span>
                      </div>
                    )}
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
