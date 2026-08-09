'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { format } from 'date-fns'
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
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Building2,
  Video,
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
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface Schedule {
  id: string
  day: string
  startTime: string
  endTime: string
  slotDuration: number
}

interface Review {
  id: string
  star: number
  review: string
  isAnonymous: boolean
  patientName: string
  createdAt: string
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
    hospitalAddress: string
    fees: number
    emergencyCharge: number
    description: string
    contactNo: string
    phoneNo: string
    isEmergency: boolean
    awardAndRecognition: string
    registrationDetail: string
  } | null
  schedules: Schedule[]
  avgRating: number
  ratingCount: number
  starDistribution: Record<number, number>
  totalPatients: number
  totalAppointments: number
  reviews: Review[]
  relatedDoctors: {
    id: string
    name: string
    profileImg: string
    doctor: { specialization: string; city: string; fees: number } | null
  }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function parseAwards(str: string): string[] {
  if (!str) return []
  try {
    const parsed = JSON.parse(str)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch {
    // not JSON, treat as newline/comma-separated
    return str.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}

// ── Animation components ─────────────────────────────────────────────────────

function FadeUpSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function DoctorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const id = params.id as string
  const [doctor, setDoctor] = useState<DoctorData | null>(null)
  const [loading, setLoading] = useState(true)

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

  // ── Derived data ──────────────────────────────────────────────────────────

  const todayName = useMemo(() => {
    const dayIndex = new Date().getDay()
    return DAYS_ORDER[dayIndex === 0 ? 6 : dayIndex - 1]
  }, [])

  const activeDays = useMemo(() => {
    if (!doctor?.schedules) return []
    return doctor.schedules
      .sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day))
  }, [doctor?.schedules])

  const awards = useMemo(() => {
    if (!doctor?.doctor?.awardAndRecognition) return []
    return parseAwards(doctor.doctor.awardAndRecognition)
  }, [doctor?.doctor?.awardAndRecognition])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Profile link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────

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
                    <Skeleton className="h-28 w-28 rounded-full shrink-0" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-7 w-3/4" />
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-5 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  // ── Not found state ───────────────────────────────────────────────────────

  if (!doctor) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Doctor Not Found</h2>
          <p className="text-muted-foreground mb-6">The doctor you are looking for does not exist or is no longer active.</p>
          <Button variant="outline" className="border-teal-200 text-teal-700 hover:bg-teal-50" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </PublicLayout>
    )
  }

  const doc = doctor.doctor

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <motion.div {...fadeIn} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-teal-600 transition-colors">
            Home
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <Link href="/doctors" className="hover:text-teal-600 transition-colors">
            Doctors
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{doctor.name}</span>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* LEFT COLUMN                                                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── A. HERO / HEADER SECTION ───────────────────────────────── */}
            <motion.div {...fadeIn}>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar with online indicator */}
                    <div className="relative mx-auto sm:mx-0 shrink-0">
                      <Avatar className="h-[120px] w-[120px] border-3 border-teal-100 dark:border-teal-900">
                        <AvatarImage
                          src={doctor.profileImg !== 'default.png' ? doctor.profileImg : ''}
                          alt={doctor.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-teal-100 to-emerald-200 text-teal-700 font-bold text-3xl">
                          {doctor.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Green online indicator */}
                      <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 dark:border-card" />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold">{doctor.name}</h1>
                        <ShieldCheck className="h-6 w-6 text-teal-500" />
                      </div>

                      {/* Specialization badge + location */}
                      <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300">
                          {doc?.specialization || 'General Physician'}
                        </Badge>
                        {doc?.city && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {doc.city}{doc.state ? `, ${doc.state}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Rating display */}
                      <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-4 w-4',
                                i < Math.round(doctor.avgRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">{doctor.avgRating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({doctor.ratingCount} review{doctor.ratingCount !== 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                        {doc?.isEmergency && (
                          <Badge variant="destructive" className="gap-1">
                            <Phone className="h-3 w-3" /> Emergency Available
                          </Badge>
                        )}
                        {doc?.experience && (
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" /> {doc.experience}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      </div>

                      {/* Fee display */}
                      <div className="mt-4 flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                          {formatCurrency(doc?.fees || 0)}
                        </span>
                        <span className="text-sm text-muted-foreground">consultation fee</span>
                      </div>

                      {/* CTA buttons */}
                      <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-teal-500/20"
                          asChild
                        >
                          <Link href={`/dashboard/patient/appointments?action=book&doctorId=${doctor.id}`}>
                            <Calendar className="h-5 w-5 mr-2" />
                            Book Appointment
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          className="gap-2"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── B. ABOUT SECTION ────────────────────────────────────────── */}
            {doc?.description && (
              <FadeUpSection>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-teal-500" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {doc.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeUpSection>
            )}

            {/* Key Details Grid */}
            <FadeUpSection delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-teal-500" />
                    Key Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {doc?.experience && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                          <Briefcase className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Experience</p>
                          <p className="text-sm font-medium mt-0.5">{doc.experience}</p>
                        </div>
                      </div>
                    )}
                    {doc?.education && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                          <GraduationCap className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Education</p>
                          <p className="text-sm font-medium mt-0.5">{doc.education}</p>
                        </div>
                      </div>
                    )}
                    {doc?.registrationDetail && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                          <ShieldCheck className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Registration</p>
                          <p className="text-sm font-medium mt-0.5">{doc.registrationDetail}</p>
                        </div>
                      </div>
                    )}
                    {awards.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
                          <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Awards & Recognition</p>
                          <ul className="mt-0.5 space-y-0.5">
                            {awards.slice(0, 3).map((award, i) => (
                              <li key={i} className="text-sm font-medium">{award}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {(doc?.city || doc?.state) && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                          <MapPin className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">City / State</p>
                          <p className="text-sm font-medium mt-0.5">
                            {[doc?.city, doc?.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {doc?.hospitalAddress && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                          <Building2 className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Hospital Address</p>
                          <p className="text-sm font-medium mt-0.5">{doc.hospitalAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeUpSection>

            {/* ── C. SCHEDULE SECTION ──────────────────────────────────────── */}
            <FadeUpSection delay={0.2}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-500" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Day pills row */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {DAYS_ORDER.map((day, i) => {
                      const schedule = activeDays.find((s) => s.day === day)
                      const isToday = day === todayName
                      return (
                        <div
                          key={day}
                          className={cn(
                            'flex flex-col items-center p-2 sm:p-3 rounded-xl border text-center transition-colors',
                            schedule
                              ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800'
                              : 'bg-muted/30 border-border opacity-40'
                          )}
                        >
                          <span className={cn(
                            'text-xs font-medium',
                            schedule ? 'text-teal-700 dark:text-teal-300' : 'text-muted-foreground'
                          )}>
                            {DAY_SHORT[i]}
                          </span>
                          {schedule ? (
                            <span className="text-[10px] sm:text-xs text-teal-600 dark:text-teal-400 mt-1 font-medium">
                              {formatTime(schedule.startTime)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground mt-1">Off</span>
                          )}
                          {isToday && (
                            <span className={cn(
                              'mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                              schedule
                                ? 'bg-teal-500 text-white'
                                : 'bg-muted text-muted-foreground'
                            )}>
                              Today
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Consolidated time ranges */}
                  {activeDays.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {activeDays.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-medium',
                              s.day === todayName
                                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950/30 dark:text-teal-300'
                                : ''
                            )}
                          >
                            {DAY_SHORT[DAYS_ORDER.indexOf(s.day)]}
                            {s.day === todayName && (
                              <span className="ml-1.5 text-[9px] px-1 py-0 rounded bg-teal-500 text-white">Today</span>
                            )}
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatTime(s.startTime)} – {formatTime(s.endTime)}
                          </span>
                          <span className="text-xs text-muted-foreground">({s.slotDuration} min slots)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeUpSection>

            {/* ── D. REVIEWS SECTION ──────────────────────────────────────── */}
            <FadeUpSection delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Patient Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctor.ratingCount === 0 ? (
                    /* Empty state */
                    <div className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No reviews yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Be the first to share your experience with {doctor.name}
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-[240px_1fr] gap-8">
                      {/* Left: rating summary + distribution */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-foreground">{doctor.avgRating.toFixed(1)}</p>
                          <div className="flex items-center justify-center gap-0.5 mt-2">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-5 w-5',
                                  i < Math.round(doctor.avgRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/30'
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Based on {doctor.ratingCount} review{doctor.ratingCount !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <Separator />

                        {/* Star distribution bars */}
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = doctor.starDistribution[star] || 0
                            const pct = doctor.ratingCount > 0 ? (count / doctor.ratingCount) * 100 : 0
                            return (
                              <div key={star} className="flex items-center gap-2 text-sm">
                                <span className="w-3 text-right font-medium text-muted-foreground">{star}</span>
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Right: individual reviews */}
                      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                        {doctor.reviews.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Detailed reviews are not available yet.
                          </p>
                        ) : (
                          doctor.reviews.map((review) => (
                            <div
                              key={review.id}
                              className="rounded-xl border p-4 transition-colors hover:bg-muted/30"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 text-sm font-semibold text-teal-700 dark:from-teal-900/40 dark:to-emerald-900/40 dark:text-teal-300">
                                    {review.isAnonymous
                                      ? '?'
                                      : review.patientName
                                          .split(' ')
                                          .map((n) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{review.patientName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(review.createdAt), 'd MMM yyyy')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        'h-3.5 w-3.5',
                                        i < review.star
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground/30'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.review && (
                                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                  {review.review}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeUpSection>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* RIGHT COLUMN (SIDEBAR)                                         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 gap-4">
              <motion.div variants={fadeIn}>
                <Card className="border-teal-200 dark:border-teal-800">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 text-teal-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      {doctor.totalPatients.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">Patients</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4 text-center">
                    <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {doctor.avgRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {doctor.totalAppointments.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardContent className="p-4 text-center">
                    <IndianRupee className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {formatCurrency(doc?.fees || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Consultation</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Book CTA Card */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white text-center">
                  <p className="text-sm text-teal-100">Consultation Fee</p>
                  <p className="text-4xl font-bold mt-1">
                    {formatCurrency(doc?.fees || 0)}
                  </p>
                  {doc?.emergencyCharge && doc.emergencyCharge > 0 && (
                    <p className="text-xs text-teal-100 mt-1">
                      Emergency: {formatCurrency(doc.emergencyCharge)}
                    </p>
                  )}
                </div>
                <CardContent className="p-6 space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white h-12 text-base font-semibold"
                    asChild
                  >
                    <Link href={`/dashboard/patient/appointments?action=book&doctorId=${doctor.id}`}>
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Appointment
                    </Link>
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <Link href={`/dashboard/patient/book/${doctor.id}`}>
                        <Video className="h-4 w-4" />
                        Video Call
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info */}
            {(doc?.contactNo || doc?.phoneNo) && (
              <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
                        <Phone className="h-5 w-5 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact</p>
                        <p className="text-sm font-medium mt-0.5">{doc.contactNo || doc.phoneNo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── E. RELATED DOCTORS ──────────────────────────────────────── */}
            {doctor.relatedDoctors && doctor.relatedDoctors.length > 0 && (
              <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-500" />
                      Related Doctors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {doctor.relatedDoctors.map((rd) => (
                      <Link key={rd.id} href={`/doctors/${rd.id}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={rd.profileImg !== 'default.png' ? rd.profileImg : ''}
                              alt={rd.name}
                            />
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
                            <p className="text-sm font-medium truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {rd.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {rd.doctor?.specialization || 'General Physician'}
                            </p>
                            {rd.doctor?.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />{rd.doctor.city}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
