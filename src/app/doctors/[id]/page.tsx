'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Star,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Clock,
  Users,
  Award,
  GraduationCap,
  Share2,
  Calendar,
  Check,
  ChevronLeft,
  ArrowRight,
  Phone,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { PublicLayout } from '@/components/layout/public-layout'

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
}

interface DoctorData {
  id: string
  name: string
  email: string
  profileImg: string
  gender: string
  createdAt: string
  doctor: {
    specialization: string
    education: string
    experience: string
    city: string
    address: string
    state: string
    fees: number
    emergencyCharge: number
    description: string
    contactNo: string
    phoneNo: string
    isEmergency: boolean
    awardAndRecognition: string
  } | null
  schedules: Schedule[]
  relatedDoctors: {
    id: string
    name: string
    profileImg: string
    doctor: { specialization: string; city: string; fees: number } | null
  }[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getNext7Days() {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
    return {
      date: d,
      dayName,
      dayShort: DAY_SHORT[DAYS.indexOf(dayName)] || d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0,
    }
  })
}

function generateSlots(schedule: Schedule) {
  const slots: string[] = []
  const start = parseInt(schedule.startTime.split(':')[0], 10)
  const end = parseInt(schedule.endTime.split(':')[0], 10)
  for (let h = start; h < end; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    if (h + 0.5 < end) {
      slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
  }
  return slots
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const id = params.id as string
  const [doctor, setDoctor] = useState<DoctorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const res = await fetch(`/api/doctors/${id}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setDoctor(data.doctor)
      } catch {
        setDoctor(null)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchDoctor()
  }, [id])

  const next7Days = useMemo(() => getNext7Days(), [])

  const scheduleForDay = useMemo(() => {
    if (!doctor?.schedules) return null
    const dayName = next7Days[selectedDate]?.dayName
    return doctor.schedules.find((s) => s.day === dayName) || null
  }, [doctor, selectedDate, next7Days])

  const slots = useMemo(() => {
    if (!scheduleForDay) return []
    return generateSlots(scheduleForDay)
  }, [scheduleForDay])

  const avgRating = 4.5 // Will come from API
  const ratingCount = 128
  const patientCount = 1250

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-7 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-5 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80" />
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!doctor) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Doctor Not Found</h2>
          <p className="text-muted-foreground mb-6">The doctor you are looking for does not exist.</p>
          <Link href="/doctors">
            <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Doctors
            </Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  const doc = doctor.doctor

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div {...fadeIn} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/doctors" className="hover:text-teal-600 transition-colors">
            Doctors
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-medium truncate">{doctor.name}</span>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <motion.div {...fadeIn}>
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Avatar className="h-28 w-28 border-3 border-teal-100 dark:border-teal-900 mx-auto sm:mx-0">
                      <AvatarImage
                        src={doctor.profileImg !== 'default.png' ? doctor.profileImg : ''}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 font-bold text-2xl">
                        {doctor.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h1 className="text-2xl md:text-3xl font-bold">{doctor.name}</h1>
                        <ShieldCheck className="h-6 w-6 text-teal-500" />
                      </div>
                      <p className="text-teal-600 dark:text-teal-400 font-medium mt-1">
                        {doc?.specialization || 'General Physician'}
                      </p>
                      <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(avgRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          {avgRating} ({ratingCount} reviews)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                        {doc?.isEmergency && (
                          <Badge variant="destructive" className="gap-1">
                            <Phone className="h-3 w-3" /> Emergency
                          </Badge>
                        )}
                        {doc?.experience && (
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" /> {doc.experience}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {doc?.education && (
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Education</p>
                          <p className="text-muted-foreground">{doc.education}</p>
                        </div>
                      </div>
                    )}
                    {doc?.experience && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Experience</p>
                          <p className="text-muted-foreground">{doc.experience}</p>
                        </div>
                      </div>
                    )}
                    {doc?.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Address</p>
                          <p className="text-muted-foreground">
                            {doc.address}
                            {doc.city ? `, ${doc.city}` : ''}
                            {doc.state ? `, ${doc.state}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                    {(doc?.contactNo || doc?.phoneNo) && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-teal-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Contact</p>
                          <p className="text-muted-foreground">
                            {doc.contactNo || doc.phoneNo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {doc?.description && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h3 className="font-semibold mb-2">About</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {doc.description}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Availability Calendar */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-500" />
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Date Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
                    {next7Days.map((d, i) => {
                      const hasSchedule = doctor.schedules.some((s) => s.day === d.dayName)
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(i)
                            setSelectedSlot(null)
                          }}
                          disabled={!hasSchedule}
                          className={`flex flex-col items-center min-w-[64px] px-3 py-3 rounded-xl text-sm transition-all duration-200 border
                            ${
                              selectedDate === i
                                ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20'
                                : hasSchedule
                                  ? 'hover:bg-teal-50 dark:hover:bg-teal-950/30 border-border hover:border-teal-300'
                                  : 'opacity-40 cursor-not-allowed border-border'
                            }`}
                        >
                          <span
                            className={`text-xs font-medium ${
                              selectedDate === i ? 'text-teal-100' : 'text-muted-foreground'
                            }`}
                          >
                            {d.dayShort}
                          </span>
                          <span className="text-lg font-bold mt-0.5">{d.dateNum}</span>
                          <span
                            className={`text-xs ${
                              selectedDate === i ? 'text-teal-100' : 'text-muted-foreground'
                            }`}
                          >
                            {d.month}
                          </span>
                          {d.isToday && (
                            <span
                              className={`mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                                selectedDate === i
                                  ? 'bg-white/20 text-white'
                                  : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                              }`}
                            >
                              Today
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Time Slots */}
                  {scheduleForDay ? (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Available slots for{' '}
                        <span className="font-medium text-foreground">
                          {next7Days[selectedDate].dayName}, {next7Days[selectedDate].dateNum}{' '}
                          {next7Days[selectedDate].month}
                        </span>
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot === selectedSlot ? null : slot)}
                            className={`py-2.5 px-3 text-sm rounded-lg border transition-all duration-200
                              ${
                                selectedSlot === slot
                                  ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20'
                                  : 'hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-300 border-border'
                              }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 text-center py-8">
                      <p className="text-muted-foreground">
                        Not available on {next7Days[selectedDate].dayName}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4">
              <motion.div variants={fadeIn}>
                <Card className="border-teal-200 dark:border-teal-800">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-teal-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      {patientCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Patients</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4 text-center">
                    <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{avgRating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4 text-center">
                    <Briefcase className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {doc?.experience?.replace(/\D/g, '') || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">Years Exp.</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {doc?.fees || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Consultation</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Book CTA */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Consultation Fee</p>
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                      <IndianRupee className="h-6 w-6 inline" />
                      {doc?.fees || 0}
                    </p>
                    {doc?.emergencyCharge && doc.emergencyCharge > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Emergency: ₹{doc.emergencyCharge}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white h-12 text-base font-semibold"
                    disabled={!selectedSlot}
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login')
                        return
                      }
                      if (user?.role !== 'patient') {
                        toast.error('Only patients can book appointments')
                        return
                      }
                      router.push(`/dashboard/patient/book/${doctor.id}`)
                    }}
                  >
                    {selectedSlot ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Book at {selectedSlot}
                      </>
                    ) : (
                      'Select a time slot to book'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share Profile
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Related Doctors */}
            {doctor.relatedDoctors && doctor.relatedDoctors.length > 0 && (
              <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Related Doctors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doctor.relatedDoctors.slice(0, 4).map((rd) => (
                      <Link key={rd.id} href={`/doctors/${rd.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-teal-50 text-teal-700 text-sm font-medium">
                              {rd.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{rd.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {rd.doctor?.specialization || 'General Physician'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
