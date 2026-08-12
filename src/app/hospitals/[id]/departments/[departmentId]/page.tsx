'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Star,
  Clock,
  IndianRupee,
  Users,
  ArrowRight,
  MapPin,
  CalendarCheck,
  AlertCircle,
  Stethoscope,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PublicLayout } from '@/components/layout/public-layout'
import { resolveAvatarUrl } from '@/lib/avatar-url'

interface Doctor {
  id: string
  name: string
  profileImg: string
  specialization: string
  designation: string
  fees: number
  opdTimings: string
  isAvailable: boolean
  avgRating: number
  totalRatings: number
}

interface DepartmentInfo {
  id: string
  name: string
  nameHi: string
  description: string
  floorNo: string
  opdRoom: string
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return 'D'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function getDesignationColor(designation: string) {
  const d = designation.toLowerCase()
  if (d.includes('hod') || d.includes('head') || d.includes('professor'))
    return 'bg-violet-100 text-violet-700 border-violet-200'
  if (d.includes('director') || d.includes('principal'))
    return 'bg-amber-100 text-amber-700 border-amber-200'
  if (d.includes('senior') || d.includes('consultant'))
    return 'bg-teal-100 text-teal-700 border-teal-200'
  if (d.includes('junior') || d.includes('resident') || d.includes('fellow'))
    return 'bg-sky-100 text-sky-700 border-sky-200'
  return 'bg-muted text-muted-foreground border-border'
}

export default function DepartmentDoctorsPage() {
  const params = useParams()
  const hospitalId = params.id as string
  const departmentId = params.departmentId as string

  const [department, setDepartment] = useState<DepartmentInfo | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('')

  useEffect(() => {
    if (!hospitalId || !departmentId) return
    const fetchDoctors = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/hospitals/${hospitalId}/departments/${departmentId}/doctors`)
        if (!res.ok) {
          setError('Department not found')
          setDepartment(null)
          setDoctors([])
          return
        }
        const data = await res.json()
        setDepartment(data.department)
        setDoctors(data.doctors || [])
      } catch {
        setError('Failed to load doctors')
        setDepartment(null)
        setDoctors([])
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [hospitalId, departmentId])

  const sortedDoctors = useMemo(() => {
    if (!sortBy) return doctors
    const sorted = [...doctors]
    if (sortBy === 'fees-low') sorted.sort((a, b) => a.fees - b.fees)
    if (sortBy === 'fees-high') sorted.sort((a, b) => b.fees - a.fees)
    if (sortBy === 'name-az') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'name-za') sorted.sort((a, b) => b.name.localeCompare(a.name))
    return sorted
  }, [doctors, sortBy])

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* Breadcrumb */}
          <motion.div {...fadeIn} className="mb-6">
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
                  <BreadcrumbLink asChild>
                    <Link href={`/hospitals/${hospitalId}`} className="hover:text-white">
                      {loading ? 'Hospital' : 'Details'}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-teal-200" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white font-medium">
                    {loading ? (
                      <Skeleton className="h-4 w-40 bg-white/20" />
                    ) : (
                      department?.name || 'Department'
                    )}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </motion.div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-white/20" />
              <Skeleton className="h-5 w-96 bg-white/15" />
              <div className="flex gap-3 mt-3">
                <Skeleton className="h-8 w-24 bg-white/15 rounded-full" />
                <Skeleton className="h-8 w-28 bg-white/15 rounded-full" />
              </div>
            </div>
          ) : error ? (
            <motion.div {...fadeIn} className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-70" />
              <h2 className="text-xl font-semibold mb-2">{error}</h2>
              <Link href={`/hospitals/${hospitalId}`}>
                <Button variant="outline" className="mt-4 border-white/30 text-white hover:bg-white/10">
                  Back to Hospital
                </Button>
              </Link>
            </motion.div>
          ) : department ? (
            <motion.div {...fadeIn}>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-bold">{department.name}</h1>
                {department.nameHi && (
                  <span className="text-teal-200 text-lg">{department.nameHi}</span>
                )}
              </div>

              {department.description && (
                <p className="text-teal-100 max-w-2xl mb-4">{department.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                {department.floorNo && (
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {department.floorNo}
                  </span>
                )}
                {department.opdRoom && (
                  <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {department.opdRoom}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {doctors.length} Doctor{doctors.length !== 1 ? 's' : ''} Available
                </span>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* Doctors Section */}
      <section className="container mx-auto px-4 py-8">
        {/* Sort Controls */}
        {!loading && !error && doctors.length > 0 && (
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Our Doctors</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Book an appointment with the best specialists
              </p>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fees-low">Fees: Low to High</SelectItem>
                <SelectItem value="fees-high">Fees: High to Low</SelectItem>
                <SelectItem value="name-az">Name: A to Z</SelectItem>
                <SelectItem value="name-za">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Doctors */}
        {!loading && !error && doctors.length === 0 && department && (
          <motion.div
            {...fadeIn}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Stethoscope className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Doctors Available</h3>
            <p className="text-muted-foreground max-w-md">
              There are currently no doctors available in this department.
            </p>
            <Link href={`/hospitals/${hospitalId}`}>
              <Button variant="outline" className="mt-6 border-teal-200 text-teal-700 hover:bg-teal-50">
                Back to Hospital
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Doctors Grid */}
        {!loading && !error && sortedDoctors.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sortedDoctors.map((doc) => {
              const avatarUrl = resolveAvatarUrl(doc.profileImg)
              return (
                <motion.div key={doc.id} variants={fadeIn}>
                  <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Doctor Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-16 w-16 ring-2 ring-teal-100 shrink-0">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={doc.name} />
                          ) : null}
                          <AvatarFallback className="bg-teal-50 text-teal-700 text-lg font-semibold">
                            {getInitials(doc.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base">{doc.name}</h3>
                          {doc.specialization && (
                            <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                          )}
                          {doc.designation && (
                            <Badge
                              variant="outline"
                              className={`mt-1 text-xs ${getDesignationColor(doc.designation)}`}
                            >
                              {doc.designation}
                            </Badge>
                          )}
                        </div>
                        {/* Availability */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              doc.isAvailable
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-300'
                                : 'bg-red-400 shadow-sm shadow-red-300'
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {doc.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      {/* Fees & Rating */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1 text-sm">
                          <IndianRupee className="h-3.5 w-3.5 text-teal-600" />
                          <span className="font-semibold text-foreground">{doc.fees}</span>
                          <span className="text-muted-foreground text-xs">consultation</span>
                        </div>
                        {doc.avgRating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{doc.avgRating}</span>
                            <span className="text-muted-foreground text-xs">({doc.totalRatings})</span>
                          </div>
                        )}
                      </div>

                      {/* OPD Timings */}
                      {doc.opdTimings && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mb-4">
                          <Clock className="h-4 w-4 shrink-0 mt-0.5 text-teal-600" />
                          <span>{doc.opdTimings}</span>
                        </div>
                      )}

                      {/* Book CTA */}
                      <div className="mt-auto">
                        <Link
                          href={`/book?doctorId=${doc.id}&hospitalId=${hospitalId}&departmentId=${departmentId}`}
                        >
                          <Button
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2 disabled:opacity-50"
                            disabled={!doc.isAvailable}
                          >
                            <CalendarCheck className="h-4 w-4" />
                            {doc.isAvailable ? 'Book Appointment' : 'Currently Unavailable'}
                          </Button>
                        </Link>
                      </div>
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
