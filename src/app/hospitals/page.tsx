'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  MapPin,
  Phone,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  X,
  ArrowUpDown,
  Star,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout/public-layout'

interface Hospital {
  id: string
  name: string
  profileImg: string
  hospital: {
    hospitalName: string
    address: string
    city: string
    state: string
    contactNo: string
  } | null
}

const BORDER_COLORS = [
  'border-t-teal-500',
  'border-t-amber-500',
  'border-t-rose-500',
  'border-t-violet-500',
  'border-t-emerald-500',
  'border-t-orange-500',
  'border-t-cyan-500',
  'border-t-pink-500',
]

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [sort, setSort] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchHospitals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (city) params.set('city', city)
      if (sort) params.set('sort', sort)

      const res = await fetch(`/api/hospitals?${params.toString()}`)
      const data = await res.json()
      setHospitals(data.hospitals || [])
      setCities(data.cities || [])
    } catch {
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, city, sort])

  useEffect(() => {
    fetchHospitals()
  }, [fetchHospitals])

  const clearFilters = () => {
    setSearch('')
    setCity('')
    setSort('')
  }

  const activeFilterCount = [city, sort].filter(Boolean).length

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div {...fadeIn} className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Find Hospitals</h1>
            <p className="text-teal-100 text-lg">
              Discover top hospitals and healthcare facilities near you
            </p>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search hospitals by name..."
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

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-teal-100 mb-1.5 block">City</label>
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
                      Sort By
                    </label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger className="bg-white/90 border-0 text-foreground">
                        <SelectValue placeholder="Default" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="az">Name: A to Z</SelectItem>
                        <SelectItem value="za">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="sm:col-span-2 flex justify-end">
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <motion.div
            {...fadeIn}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
              <Building2 className="h-10 w-10 text-teal-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Hospitals Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Try adjusting your search or filter criteria to find the hospital you&apos;re looking
              for.
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-teal-200 text-teal-700 hover:bg-teal-50"
            >
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
            {hospitals.map((h, idx) => (
              <motion.div key={h.id} variants={fadeIn}>
                <Card className="group overflow-hidden border-border/60 border-t-4 {BORDER_COLORS[idx % BORDER_COLORS.length]} hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ borderTopColor: undefined }}>
                  <div className={`border-t-4 ${BORDER_COLORS[idx % BORDER_COLORS.length]}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 flex items-center justify-center shrink-0">
                          <Building2 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">
                            {h.hospital?.hospitalName || h.name}
                          </h3>
                        </div>
                      </div>
                      {idx < 2 && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shrink-0">
                          <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {h.hospital?.address && (
                      <p className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{h.hospital.address}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {h.hospital?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {h.hospital.city}
                          {h.hospital.state ? `, ${h.hospital.state}` : ''}
                        </span>
                      )}
                    </div>

                    {h.hospital?.contactNo && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {h.hospital.contactNo}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </PublicLayout>
  )
}
