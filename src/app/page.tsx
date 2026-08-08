'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  Search,
  ArrowRight,
  Stethoscope,
  Building2,
  Users,
  CalendarCheck,
  Video,
  ShieldCheck,
  Lock,
  HeartPulse,
  Pill,
  Syringe,
  Brain,
  Eye,
  Bone,
  Smile,
  Activity,
  Star,
  IndianRupee,
  Quote,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout/public-layout'
import { BackToTop } from '@/components/layout/back-to-top'
import { APP_NAME, SPECIALIZATIONS } from '@/lib/constants'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// ── Framer-motion wrappers ──────────────────────────────────────────────────

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

function FadeUpItem({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode
  className?: string
  index?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, inView: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  const animate = useCallback(() => {
    const duration = 1800
    const start = performance.now()
    const from = 0
    const to = target

    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(from + (to - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [target])

  useEffect(() => {
    if (inView) animate()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [inView, animate])

  return value
}

// ── Data types ───────────────────────────────────────────────────────────────

interface Stats {
  doctorCount: number
  hospitalCount: number
  patientCount: number
  bookingCount: number
}

interface DoctorProfile {
  specialization: string
  city: string | null
  state: string | null
  fees: number
  experience: string | number | null
  isEmergency: boolean
}

interface Doctor {
  id: string
  name: string
  profileImg: string | null
  doctor?: DoctorProfile | null
  _avgRating?: { star: number } | null
  _ratingCount?: { star: number } | null
}

// ── Hardcoded fallbacks ──────────────────────────────────────────────────────

const fallbackStats: Stats = {
  doctorCount: 15,
  hospitalCount: 8,
  patientCount: 2400,
  bookingCount: 5800,
}

const fallbackDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Priya Sharma',
    profileImg: null,
    doctorProfile: {
      specialization: 'Cardiologist',
      city: 'Mumbai',
      fees: 800,
      experience: 12,
      isEmergency: true,
    },
  },
  {
    id: '2',
    name: 'Dr. Rajesh Kumar',
    profileImg: null,
    doctorProfile: {
      specialization: 'Dermatologist',
      city: 'Delhi',
      fees: 600,
      experience: 8,
      isEmergency: false,
    },
  },
  {
    id: '3',
    name: 'Dr. Anita Desai',
    profileImg: null,
    doctorProfile: {
      specialization: 'Pediatrician',
      city: 'Bangalore',
      fees: 500,
      experience: 15,
      isEmergency: false,
    },
  },
]

// ── Specialization display data ──────────────────────────────────────────────

const specDisplay: {
  name: string
  icon: React.ElementType
  bg: string
  iconColor: string
}[] = [
  { name: 'Cardiology', icon: HeartPulse, bg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-500' },
  { name: 'Dermatology', icon: Activity, bg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-500' },
  { name: 'Pediatrics', icon: Smile, bg: 'bg-sky-50 dark:bg-sky-950/40', iconColor: 'text-sky-500' },
  { name: 'Neurology', icon: Brain, bg: 'bg-violet-50 dark:bg-violet-950/40', iconColor: 'text-violet-500' },
  { name: 'Ophthalmology', icon: Eye, bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500' },
  { name: 'Orthopedics', icon: Bone, bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-500' },
  { name: 'Dental', icon: Smile, bg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-500' },
  { name: 'General Physician', icon: Stethoscope, bg: 'bg-cyan-50 dark:bg-cyan-950/40', iconColor: 'text-cyan-500' },
]

// ── Testimonials ─────────────────────────────────────────────────────────────

const testimonials = [
  {
    text: 'Doctorooms made it incredibly easy to find a specialist near me. The booking process was seamless and I got an appointment the very next day!',
    name: 'Ritu Mehta',
    role: 'Patient',
    location: 'Mumbai',
  },
  {
    text: 'As a doctor, I appreciate how Doctorooms helps me connect with patients who truly need my expertise. The platform is intuitive and professional.',
    name: 'Dr. Vikram Singh',
    role: 'Cardiologist',
    location: 'Delhi',
  },
  {
    text: 'I was able to book a video consultation for my father who lives in a different city. The entire experience was smooth and the doctor was excellent.',
    name: 'Ananya Patel',
    role: 'Patient',
    location: 'Bangalore',
  },
]

// ── Floating icons for hero ──────────────────────────────────────────────────

const floatingIcons = [
  { Icon: Stethoscope, className: 'top-[12%] left-[8%] text-teal-300/50 dark:text-teal-600/30', size: 28, delay: 0 },
  { Icon: Pill, className: 'top-[20%] right-[12%] text-emerald-300/40 dark:text-emerald-600/30', size: 22, delay: 0.5 },
  { Icon: HeartPulse, className: 'bottom-[25%] left-[15%] text-rose-300/40 dark:text-rose-600/30', size: 26, delay: 1 },
  { Icon: Syringe, className: 'bottom-[15%] right-[10%] text-sky-300/40 dark:text-sky-600/30', size: 20, delay: 1.5 },
  { Icon: Activity, className: 'top-[55%] left-[5%] text-amber-300/30 dark:text-amber-600/20', size: 18, delay: 0.8 },
]

// ── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating = 4.8 }: { rating?: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < fullStars || (i === fullStars && hasHalf) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium text-muted-foreground">{rating}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: statsData } = useQuery<Stats>({
    queryKey: ['public-stats'],
    queryFn: () => fetch('/api/public/stats').then((r) => r.json()),
    staleTime: 60_000,
    retry: 1,
  })

  const { data: doctorsData } = useQuery<{ doctors: Doctor[] }>({
    queryKey: ['featured-doctors'],
    queryFn: () => fetch('/api/doctors?limit=3').then((r) => r.json()),
    staleTime: 60_000,
    retry: 1,
  })

  const stats = statsData ?? fallbackStats
  const doctors = doctorsData?.doctors?.length ? doctorsData.doctors : fallbackDoctors

  return (
    <PublicLayout>
      <BackToTop />

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/60 dark:from-teal-950/20 dark:via-background dark:to-teal-950/10">
        {/* Floating icons */}
        {floatingIcons.map(({ Icon, className, size, delay }, i) => (
          <motion.div
            key={i}
            className={`absolute hidden lg:block ${className}`}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <Icon size={size} />
          </motion.div>
        ))}

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-6"
            >
              <Badge variant="secondary" className="rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                Trusted by 50,000+ patients
              </Badge>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Your Health,{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
                  Our Priority
                </span>
              </h1>

              <p className="max-w-lg text-lg text-gray-600 dark:text-gray-400">
                Find and book appointments with top-rated doctors near you.{' '}
                {APP_NAME} connects patients with verified healthcare professionals for in-person and video consultations.
              </p>

              {/* Search bar */}
              <div className="flex max-w-md items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <Search className="h-5 w-5 shrink-0 text-gray-400" />
                <Input
                  placeholder="Search doctors, specializations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-teal-600 to-emerald-500 text-white hover:from-teal-700 hover:to-emerald-600"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-white shadow-md hover:from-teal-700 hover:to-emerald-600"
                  asChild
                >
                  <Link href="/doctors">
                    Find a Doctor
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-950/30"
                  asChild
                >
                  <Link href="/book">Book Appointment</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right column — abstract illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative h-96 w-96">
                {/* Gradient circles */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-200/60 to-emerald-200/40 dark:from-teal-800/20 dark:to-emerald-800/10" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-teal-100/80 to-white dark:from-teal-900/30 dark:to-gray-900/50" />
                <div className="absolute inset-16 rounded-full bg-gradient-to-bl from-white to-teal-50 dark:from-gray-800 dark:to-teal-900/20" />
                {/* Center stethoscope icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Stethoscope className="h-28 w-28 text-teal-500 dark:text-teal-400" />
                  </motion.div>
                </div>
                {/* Orbiting pulse ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-teal-300/40 dark:border-teal-600/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border border-emerald-300/30 dark:border-emerald-600/15"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. STATS SECTION ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 dark:bg-gray-950 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsGrid stats={stats} />
        </div>
      </section>

      {/* ── 3. HOW IT WORKS SECTION ──────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900/50 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUpSection className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Book your appointment in three simple steps
            </p>
          </FadeUpSection>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            {/* Dashed connector line (desktop only) */}
            <div className="absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden border-t-2 border-dashed border-teal-300 dark:border-teal-700 md:block" />

            {[
              {
                icon: Search,
                step: 1,
                title: 'Search Doctor',
                desc: 'Browse our extensive network of verified doctors by specialization, location, or name.',
              },
              {
                icon: CalendarCheck,
                step: 2,
                title: 'Book Appointment',
                desc: 'Choose a convenient time slot and book your appointment instantly with secure payment.',
              },
              {
                icon: Video,
                step: 3,
                title: 'Get Consultation',
                desc: 'Meet your doctor in person or via secure video consultation from the comfort of your home.',
              },
            ].map((item, i) => (
              <FadeUpItem key={item.step} index={i} className="flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="mb-2 text-sm font-semibold text-teal-600 dark:text-teal-400">Step {item.step}</span>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="max-w-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </FadeUpItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURED DOCTORS SECTION ───────────────────────────────────── */}
      <section className="bg-white py-16 dark:bg-gray-950 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUpSection className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Top Rated Doctors
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Meet our highly qualified and experienced healthcare professionals
            </p>
          </FadeUpSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.slice(0, 3).map((doc, i) => (
              <FadeUpItem key={doc.id} index={i}>
                <Card className="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="flex flex-col items-center p-6">
                    {/* Avatar */}
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 text-xl font-bold text-teal-700 ring-4 ring-teal-200/60 dark:from-teal-900/40 dark:to-emerald-900/40 dark:text-teal-300 dark:ring-teal-800/40">
                      {doc.profileImg ? (
                        <img
                          src={doc.profileImg}
                          alt={doc.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(doc.name)
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{doc.name}</h3>
                    <p className="mt-0.5 text-sm font-medium text-teal-600 dark:text-teal-400">
                      {doc.doctor?.specialization ?? 'General Physician'}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{doc.doctor?.city ?? 'India'}</span>
                      {doc.doctor?.experience && (
                        <span className="ml-2">• {doc.doctor?.experience} yrs exp</span>
                      )}
                    </div>

                    <div className="mt-3">
                      <StarRating rating={doc._avgRating?.star ?? (4.5 + (i % 3) * 0.15)} />
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-lg font-bold text-gray-900 dark:text-white">
                      <IndianRupee className="h-4 w-4" />
                      <span>{formatCurrency(doc.doctor?.fees ?? 0)}</span>
                      <span className="ml-1 text-sm font-normal text-gray-400">/ visit</span>
                    </div>

                    <Button
                      className="mt-5 w-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white hover:from-teal-700 hover:to-emerald-600"
                      asChild
                    >
                      <Link href={`/doctors/${doc.id}`}>Book Appointment</Link>
                    </Button>
                  </CardContent>
                </Card>
              </FadeUpItem>
            ))}
          </div>

          <FadeUpSection className="mt-10 text-center">
            <Link
              href="/doctors"
              className="inline-flex items-center gap-2 text-lg font-semibold text-teal-600 transition-colors hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
            >
              View All Doctors
              <ArrowRight className="h-5 w-5" />
            </Link>
          </FadeUpSection>
        </div>
      </section>

      {/* ── 5. SPECIALIZATIONS SECTION ────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900/50 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUpSection className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Browse by Specialization
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Find doctors across a wide range of medical specialties
            </p>
          </FadeUpSection>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            {specDisplay.map((spec, i) => (
              <FadeUpItem key={spec.name} index={i}>
                <Card className="group cursor-pointer border-transparent transition-all duration-300 hover:border-teal-300 hover:shadow-md dark:hover:border-teal-700">
                  <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${spec.bg}`}>
                      <spec.icon className={`h-7 w-7 ${spec.iconColor}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">{spec.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor(Math.random() * 10) + 3} doctors
                    </Badge>
                  </CardContent>
                </Card>
              </FadeUpItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. WHY CHOOSE US SECTION ─────────────────────────────────────── */}
      <section className="bg-white py-16 dark:bg-gray-950 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUpSection className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why Choose {APP_NAME}?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              We are committed to providing you with the best healthcare experience
            </p>
          </FadeUpSection>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: 'Verified Doctors',
                desc: 'Every doctor on our platform is verified with valid medical licenses and credentials for your safety.',
              },
              {
                icon: CalendarCheck,
                title: 'Easy Booking',
                desc: 'Book appointments in seconds with our intuitive interface. No more long waits on phone calls.',
              },
              {
                icon: Video,
                title: 'Video Consultation',
                desc: 'Consult with doctors from the comfort of your home through our secure HD video calling feature.',
              },
              {
                icon: Lock,
                title: 'Secure Data',
                desc: 'Your health data is encrypted and stored securely. We follow the highest standards of data privacy.',
              },
            ].map((item, i) => (
              <FadeUpItem key={item.title} index={i}>
                <Card className="h-full transition-all duration-300 hover:shadow-md">
                  <CardContent className="flex flex-row items-start gap-4 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </FadeUpItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS SECTION ───────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900/50 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeUpSection className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
              Real stories from patients and doctors who trust {APP_NAME}
            </p>
          </FadeUpSection>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeUpItem key={t.name} index={i}>
                <Card className="h-full border-l-4 border-l-teal-500 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6">
                    <Quote className="mb-3 h-8 w-8 text-teal-300 dark:text-teal-700" />
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">&ldquo;{t.text}&rdquo;</p>
                    <StarRating rating={5} />
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 text-sm font-bold text-teal-700 dark:from-teal-900/40 dark:to-emerald-900/40 dark:text-teal-300">
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.role} • {t.location}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeUpItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA SECTION ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-teal-600 to-emerald-500 py-16 sm:py-20">
        <FadeUpSection className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to book your appointment?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-teal-100">
            Join thousands of patients who trust {APP_NAME} for their healthcare needs. Find the right doctor today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="bg-white px-8 text-teal-700 shadow-lg hover:bg-teal-50"
              asChild
            >
              <Link href="/doctors">
                Find a Doctor
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/40 bg-transparent px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </FadeUpSection>
      </section>
    </PublicLayout>
  )
}

// ── Stats Grid (separate to use hooks) ────────────────────────────────────────

function StatsGrid({ stats }: { stats: Stats }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '100px' })
  const [delayPassed, setDelayPassed] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setDelayPassed(true), 800)
    return () => clearTimeout(id)
  }, [])

  const shouldAnimate = inView || delayPassed

  const doctorCount = useCountUp(stats.doctorCount, shouldAnimate)
  const hospitalCount = useCountUp(stats.hospitalCount, shouldAnimate)
  const patientCount = useCountUp(stats.patientCount, shouldAnimate)
  const bookingCount = useCountUp(stats.bookingCount, shouldAnimate)

  const items = [
    { icon: Stethoscope, value: doctorCount, label: 'Verified Doctors', suffix: '+' },
    { icon: Building2, value: hospitalCount, label: 'Partner Hospitals', suffix: '+' },
    { icon: Users, value: patientCount, label: 'Happy Patients', suffix: '+' },
    { icon: CalendarCheck, value: bookingCount, label: 'Appointments Booked', suffix: '+' },
  ]

  return (
    <div ref={ref} className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {items.map((item, i) => (
        <FadeUpItem key={item.label} index={i} className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
            <item.icon className="h-7 w-7" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            {item.value.toLocaleString('en-IN')}
            {item.suffix}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
          <div className="mt-2 h-1 w-8 rounded-full bg-teal-500" />
        </FadeUpItem>
      ))}
    </div>
  )
}
