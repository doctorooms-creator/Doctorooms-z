'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Search,
  Eye,
  MapPin,
  Phone,
  Globe,
  Mail,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface HospitalItem {
  id: string
  hospitalName: string
  address: string
  city: string
  state: string
  contactNo: string
  createdAt: string
  userName: string
  userEmail: string
}

interface HospitalsResponse {
  hospitals: HospitalItem[]
  cities: string[]
  total: number
}

export default function AdminHospitalsPage() {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [viewHospital, setViewHospital] = useState<HospitalItem | null>(null)

  const { data, isLoading } = useQuery<HospitalsResponse>({
    queryKey: ['admin-hospitals', search, cityFilter],
    queryFn: () =>
      fetch(`/api/dashboard/admin/hospitals?search=${encodeURIComponent(search)}&city=${cityFilter}`).then((r) =>
        r.json()
      ),
  })

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hospitals"
          value={data?.total ?? 0}
          icon={Building2}
          trend={{ value: 5, label: 'from last month' }}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Cities Covered"
          value={new Set(data?.hospitals?.map((h) => h.city) || []).size}
          icon={MapPin}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="This Month"
          value={0}
          icon={Calendar}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Avg per City"
          value={
            data?.total && new Set(data.hospitals.map((h) => h.city)).size
              ? (data.total / new Set(data.hospitals.map((h) => h.city)).size).toFixed(1)
              : 0
          }
          icon={Building2}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <MapPin className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {data?.cities?.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hospitals table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Hospitals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">City</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.hospitals?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No hospitals found</p>
                      </TableCell>
                    </TableRow>
                  )}
                  <AnimatePresence>
                    {data?.hospitals?.map((hosp, i) => (
                      <motion.tr
                        key={hosp.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{hosp.hospitalName}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{hosp.city}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                          {hosp.address || '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{hosp.city}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {hosp.contactNo || '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewHospital(hosp)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Hospital Dialog */}
      <Dialog open={!!viewHospital} onOpenChange={() => setViewHospital(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hospital Details</DialogTitle>
          </DialogHeader>
          {viewHospital && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Building2 className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewHospital.hospitalName}</h3>
                  <p className="text-sm text-muted-foreground">{viewHospital.city}</p>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{viewHospital.address || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium">{viewHospital.contactNo || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{viewHospital.userEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Registered:</span>
                  <span className="font-medium">{format(new Date(viewHospital.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
