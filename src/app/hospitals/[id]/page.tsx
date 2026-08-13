'use client'

import { useState, useEffect, createElement } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  BedDouble,
  Award,
  ShieldCheck,
  Users,
  BriefcaseMedical,
  ArrowRight,
  ChevronRight,
  Home,
  Clock,
  Stethoscope,
  HeartPulse,
  Bone,
  Brain,
  Eye,
  Baby,
  Ear,
  Scissors,
  Droplets,
  Pill,
  Scan,
  Heart,
  Activity,
  Syringe,
  Thermometer,
  Zap,
  Breadcrumb as BreadcrumbIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PublicLayout } from '@/components/layout/public-layout'

// Icon mapping for department icons from the database
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartPulse,
  Bone,
  Brain,
  Stethoscope,
  Eye,
  Baby,
  Ear,
  Scissors,
  Droplets,
  Pill,
  Scan,
  Heart,
  Activity,
  Syringe,
  Thermometer,
  Zap,
}

const DEPT_COLORS = [
  'from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30',
  'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30',
  'from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30',
  'from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30',
  'from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30',
  'from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30',
  'from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30',
  'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30',
]

const ICON_COLORS = [
  'text-teal-600',
  'text-amber-600',
  'text-rose-600',
  'text-violet-600',
  'text-emerald-600',
  'text-cyan-600',
  'text-pink-600',
  'text-orange-600',
]

interface Department {
  id: string
  name: string
  nameHi: string
  description: string
  icon: string
  floorNo: string
  opdRoom: string
  sortOrder: number
  doctorCount: number
}

interface HospitalData {
  id: string
  hospitalName: string
  address: string
  city: string
  state: string
  pincode: string
  email: string
  contactNo: string
  website: string
  hospitalType: string
  establishedYear: number
  bedCount: number
  accreditation: string
  facilities: string
  about: string
  departments: Department[]
  totalDoctors: number
  user: {
    id: string
    name: string
    profileImg: string
    status: string
  }
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function HospitalDetailPage() {
  const params = useParams()
  const hospitalId = params.id as string

  const [hospital, setHospital] = useState<HospitalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hospitalId) return
    const fetchHospital = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/hospitals/${hospitalId}`)
        if (!res.ok) {
          setError('Hospital not found')
          setHospital(null)
          return
        }
        const data = await res.json()
        setHospital(data)
      } catch {
        setError('Failed to load hospital details')
        setHospital(null)
      } finally {
        setLoading(false)
      }
    }
    fetchHospital()
  }, [hospitalId])

  let facilities: string[] = []
  if (hospital?.facilities) {
    try {
      facilities = JSON.parse(hospital.facilities)
    } catch {
      /* ignore */
    }
  }

  const availableDepts = hospital?.departments.filter((d) => d.doctorCount > 0).length ?? 0

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* Breadcrumb */}
          <motion.div
            {...fadeIn}
            className="mb-6"
          >
            <Breadcrumb>
              <BreadcrumbList className="text-teal-100">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="hover:text-white">
                      <Home className="h-3.5 w-3.5" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-teal-200" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/hospitals" className="hover:text-white">
                      Hospitals
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-teal-200" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white font-medium">
                    {loading ? (
                      <Skeleton className="h-4 w-40 bg-white/20" />
                    ) : (
                      hospital?.hospitalName || 'Hospital'
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </motion.div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 bg-white/20" />
              <Skeleton className="h-5 w-96 bg-white/15" />
              <Skeleton className="h-4 w-80 bg-white/10" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-10 w-32 bg-white/15 rounded-full" />
                <Skeleton className="h-10 w-32 bg-white/15 rounded-full" />
                <Skeleton className="h-10 w-32 bg-white/15 rounded-full" />
              </div>
            </div>
          ) : error ? (
            <motion.div {...fadeIn} className="text-center py-10">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-70" />
              <h2 className="text-xl font-semibold mb-2">{error}</h2>
              <Link href="/hospitals">
                <Button variant="outline" className="mt-4 border-white/30 text-white hover:bg-white/10">
                  Back to Hospitals
                </Button>
              </Link>
            </motion.div>
          ) : hospital ? (
            <motion.div {...fadeIn}>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold">{hospital.hospitalName}</h1>
                <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/20 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {hospital.hospitalType || 'Multi-Specialty'}
                </Badge>
                {hospital.accreditation && (
                  <Badge className="bg-amber-500/80 text-white border-amber-400 text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    {hospital.accreditation}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-teal-100 text-sm mb-4">
                {hospital.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {hospital.address}
                    {hospital.city && `, ${hospital.city}`}
                    {hospital.state && `, ${hospital.state}`}
                  </span>
                )}
                {hospital.contactNo && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {hospital.contactNo}
                  </span>
                )}
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {hospital.email && (
                  <a
                    href={`mailto:${hospital.email}`}
                    className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {hospital.email}
                  </a>
                )}
                {hospital.website && (
                  <a
                    href={hospital.website.startsWith('http') ? hospital.website : `https://${hospital.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                {hospital.establishedYear > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Est. {hospital.establishedYear}
                  </span>
                )}
                {hospital.bedCount > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <BedDouble className="h-3.5 w-3.5" />
                    {hospital.bedCount} Beds
                  </span>
                )}
              </div>

              {/* Facilities */}
              {facilities.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {facilities.map((f) => (
                    <Badge key={f} variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* Quick Stats */}
      {!loading && !error && hospital && (
        <section className="bg-white dark:bg-background border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { label: 'Departments', value: hospital.departments.length, icon: BriefcaseMedical, color: 'text-teal-600' },
                { label: 'Total Doctors', value: hospital.totalDoctors, icon: Users, color: 'text-emerald-600' },
                { label: 'Available', value: availableDepts, icon: Activity, color: 'text-amber-600' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Departments Grid */}
      <section className="container mx-auto px-4 py-8">
        {!loading && !error && hospital && (
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Departments</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a department to view available doctors
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error || !hospital ? null : hospital.departments.length === 0 ? (
          <motion.div
            {...fadeIn}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <BriefcaseMedical className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Departments Available</h3>
            <p className="text-muted-foreground max-w-md">
              This hospital hasn&apos;t added any departments yet.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hospital.departments.map((dept, idx) => {
              const IconComponent = iconMap[dept.icon] || Stethoscope
              const bgGradient = DEPT_COLORS[idx % DEPT_COLORS.length]
              const iconColor = ICON_COLORS[idx % ICON_COLORS.length]

              return (
                <motion.div key={dept.id} variants={fadeIn}>
                  <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Department header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center shrink-0`}>
                          {createElement(IconComponent, { className: `h-6 w-6 ${iconColor}` })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base">{dept.name}</h3>
                          {dept.nameHi && (
                            <p className="text-xs text-muted-foreground">{dept.nameHi}</p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {dept.doctorCount}
                        </Badge>
                      </div>

                      {/* Description */}
                      {dept.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {dept.description}
                        </p>
                      )}

                      {/* Floor & OPD */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4 mt-auto">
                        {dept.floorNo && (
                          <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                            <Building2 className="h-3 w-3" />
                            {dept.floorNo}
                          </span>
                        )}
                        {dept.opdRoom && (
                          <span className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                            <Clock className="h-3 w-3" />
                            {dept.opdRoom}
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <Link href={`/hospitals/${hospitalId}/departments/${dept.id}`}>
                        <Button
                          variant="outline"
                          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 gap-2"
                        >
                          View Doctors
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </section>
    </PublicLayout>
  )
}
