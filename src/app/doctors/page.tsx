'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Stethoscope,
  ChevronDown,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SPECIALIZATIONS } from '@/lib/constants'
import { PublicLayout } from '@/components/layout/public-layout'

interface Doctor {
  id: string
  name: string
  profileImg: string
  doctor: {
    specialization: string
    city: string
    state: string
    fees: number
    experience: string
    isEmergency: boolean
  } | null
  _avgRating: { star: number } | null
  _ratingCount: { star: number } | null
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (specialization) params.set('specialization', specialization)
      if (city) params.set('city', city)
      if (state) params.set('state', state)

      const res = await fetch(`/api/doctors?${params.toString()}`)
      const data = await res.json()
      setDoctors(data.doctors || [])
      setTotalCount(data.total || 0)
      setCities(data.cities || [])
      setStates(data.states || [])
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, specialization, city, state])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const activeFilterCount = [specialization, city, state].filter(Boolean).length

  const clearFilters = () => {
    setSpecialization('')
    setCity('')
    setState('')
    setSearch('')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
        }`}
      />
    ))
  }

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div {...fadeIn} className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Find Your Doctor</h1>
            <p className="text-teal-100 text-lg">
              Search from our network of verified healthcare professionals
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search doctors by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-teal-300"
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/20"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-white text-teal-700 hover:bg-white/90 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </Button>
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-teal-100 mb-1.5 block">
                      Specialization
                    </label>
                    <Select value={specialization} onValueChange={setSpecialization}>
                      <SelectTrigger className="bg-white/90 border-0 text-foreground">
                        <SelectValue placeholder="All Specializations" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-teal-100 mb-1.5 block">
                      City
                    </label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="bg-white/90 border-0 text-foreground">
                        <SelectValue placeholder="All Cities" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-teal-100 mb-1.5 block">
                      State
                    </label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="bg-white/90 border-0 text-foreground">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="sm:col-span-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-8">
        {/* Result Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <>
                Showing{' '}
                <span className="font-semibold text-foreground">{doctors.length}</span> of{' '}
                <span className="font-semibold text-foreground">{totalCount}</span> doctors
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <motion.div
            {...fadeIn}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
              <Stethoscope className="h-10 w-10 text-teal-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Doctors Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Try adjusting your search or filter criteria to find the doctor you&apos;re looking
              for.
            </p>
            <Button variant="outline" onClick={clearFilters} className="border-teal-200 text-teal-700 hover:bg-teal-50">
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {doctors.map((doc) => {
              const rating = doc._avgRating?.star || 0
              const ratingCount = doc._ratingCount?.star || 0
              const spec = doc.doctor?.specialization || 'General Physician'
              const docCity = doc.doctor?.city || ''
              const fees = doc.doctor?.fees || 0
              const isVerified = true

              return (
                <motion.div key={doc.id} variants={fadeIn}>
                  <Card className="group overflow-hidden border-border/60 hover:shadow-lg transition-all duration-300 hover:border-l-teal-500 hover:border-l-4">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-teal-100 dark:border-teal-900">
                          <AvatarImage src={doc.profileImg !== 'default.png' ? doc.profileImg : ''} />
                          <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 font-semibold text-lg">
                            {doc.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base truncate">
                              {doc.name}
                            </h3>
                            {isVerified && <ShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{spec}</p>
                          <div className="flex items-center gap-1 mb-1">
                            {renderStars(rating)}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({ratingCount})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {docCity && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {docCity}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
                            <IndianRupee className="h-3.5 w-3.5" />
                            {fees}
                          </span>
                        </div>
                      </div>

                      <Link href={`/doctors/${doc.id}`}>
                        <Button className="w-full mt-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white">
                          Book Appointment
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
