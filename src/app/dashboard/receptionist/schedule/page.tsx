'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, CalendarOff } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ScheduleDay {
  day: string
  startTime: string
  endTime: string
  slotDuration: number
  timeSlots: string[]
}

interface Holiday {
  id: string
  date: string
  remark: string
}

interface ScheduleData {
  doctor: {
    id: string
    name: string
    profileImg: string
    specialization: string
  }
  schedules: (ScheduleDay | null)[]
  holidays: Holiday[]
  todayName: string
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ReceptionistSchedulePage() {
  const { data, isLoading } = useQuery<ScheduleData>({
    queryKey: ['receptionist-schedule'],
    queryFn: () => fetch('/api/dashboard/receptionist/schedule').then(r => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
          <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Doctor&apos;s Schedule</h2>
          <p className="text-sm text-muted-foreground">
            Dr. {data.doctor.name}{data.doctor.specialization ? ` · ${data.doctor.specialization}` : ''}
          </p>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.schedules.map((day, i) => {
          const dayName = dayNames[i]
          if (!day) {
            return (
              <motion.div
                key={dayName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-muted-foreground">{dayName}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Off
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground/60">No schedule</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }

          const isToday = day.day === data.todayName
          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                'h-full border-l-4 transition-shadow hover:shadow-md',
                isToday ? 'border-l-teal-500 bg-teal-50/30 dark:bg-teal-950/10' : 'border-l-emerald-400'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        isToday ? 'bg-teal-500' : 'bg-emerald-500'
                      )} />
                      <p className={cn('text-sm font-semibold', isToday && 'text-teal-700 dark:text-teal-400')}>
                        {day.day}
                      </p>
                      {isToday && (
                        <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                          Today
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{day.startTime} - {day.endTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Slot duration: {day.slotDuration} min
                    </p>
                    {day.timeSlots.length > 0 && (
                      <div className="mt-2 max-h-24 overflow-y-auto">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">TIME SLOTS</p>
                        <div className="flex flex-wrap gap-1">
                          {day.timeSlots.map((slot) => (
                            <span
                              key={slot}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Holidays */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5 text-red-500" />
          <h3 className="text-base font-semibold">Upcoming Holidays</h3>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/50 dark:text-red-400">
            {data.holidays.length}
          </span>
        </div>
        {data.holidays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <CalendarOff className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No upcoming holidays</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.holidays.map((holiday, i) => (
              <motion.div
                key={holiday.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-red-200/50 dark:border-red-900/30">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <CalendarOff className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{format(new Date(holiday.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{holiday.remark || 'No remark'}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
