'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Search,
  Plus,
  Calendar,
  Pill,
  Eye,
  Share2,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Medicine {
  id: string
  medicine: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  tab: number
  dose: string
  description: string
}

interface Label {
  id: string
  label: string
  value: string
  labelUnit: string
}

interface Prescription {
  id: string
  patientName: string
  patientAge: string
  disease: string
  weight: string
  bp: string
  temperature: string
  description: string
  createdAt: string
  medicines: Medicine[]
  labels: Label[]
  isShared: boolean
}

interface SharedPrescription extends Prescription {
  isShared: true
  originalDoctorName: string
  originalDoctorSpecialization: string
  accessGrantedAt: string
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ isShared }: { isShared: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <FileText className="h-12 w-12 mb-3 opacity-40" />
      <p className="font-medium">No prescriptions found</p>
      {!isShared ? (
        <>
          <p className="text-sm mt-1 mb-4">Create your first prescription for a patient.</p>
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/dashboard/doctor/prescriptions/new">
              <Plus className="mr-2 h-4 w-4" /> New Prescription
            </Link>
          </Button>
        </>
      ) : (
        <p className="text-sm mt-1">No prescriptions have been shared with you yet.</p>
      )}
    </div>
  )
}

function PrescriptionCard({ rx, index }: { rx: Prescription; index: number }) {
  return (
    <motion.div
      key={rx.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/dashboard/doctor/prescriptions/${rx.id}`}>
        <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {rx.patientName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(rx.createdAt), 'MMM d, yyyy')}
                  {rx.patientAge && <span>· Age: {rx.patientAge}</span>}
                </div>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </div>

            {rx.disease && (
              <Badge variant="secondary" className="text-xs">{rx.disease}</Badge>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" /> {rx.medicines.length} medicines
              </span>
              {rx.labels.length > 0 && (
                <span>{rx.labels.length} labels</span>
              )}
            </div>

            {rx.medicines.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {rx.medicines.slice(0, 3).map((m) => (
                  <Badge key={m.id} variant="outline" className="text-[10px]">
                    {m.medicine}
                  </Badge>
                ))}
                {rx.medicines.length > 3 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{rx.medicines.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function SharedPrescriptionCard({ rx, index }: { rx: SharedPrescription; index: number }) {
  return (
    <motion.div
      key={rx.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/dashboard/doctor/prescriptions/${rx.id}`}>
        <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 border-l-4 border-l-teal-500 dark:border-l-teal-600">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {rx.patientName}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <Share2 className="h-3 w-3" />
                  <span>Access granted {format(new Date(rx.accessGrantedAt), 'MMM d, yyyy')}</span>
                  {rx.patientAge && <span>· Age: {rx.patientAge}</span>}
                </div>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
            </div>

            <Badge className="bg-teal-600 hover:bg-teal-600 text-white text-xs">
              <Share2 className="mr-1 h-3 w-3" />
              Shared
            </Badge>

            <p className="text-xs text-muted-foreground">
              By{' '}
              <span className="font-medium text-foreground">Dr. {rx.originalDoctorName}</span>
              <span className="text-muted-foreground"> ({rx.originalDoctorSpecialization})</span>
            </p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Pill className="h-3 w-3" /> {rx.medicines.length} medicines
              </span>
              {rx.labels.length > 0 && (
                <span>{rx.labels.length} labels</span>
              )}
            </div>

            {rx.medicines.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {rx.medicines.slice(0, 3).map((m) => (
                  <Badge key={m.id} variant="outline" className="text-[10px]">
                    {m.medicine}
                  </Badge>
                ))}
                {rx.medicines.length > 3 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{rx.medicines.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function DoctorPrescriptionsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeTab, setActiveTab] = useState('own')

  // Simple debounce
  const handleSearch = (value: string) => {
    setSearch(value)
    setTimeout(() => setDebouncedSearch(value), 300)
  }

  const { data, isLoading } = useQuery<{ prescriptions: Prescription[] }>({
    queryKey: ['doctor-prescriptions', debouncedSearch, activeTab],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/prescriptions?search=${encodeURIComponent(debouncedSearch)}&type=${activeTab}`).then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTab === 'own' && (
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/dashboard/doctor/prescriptions/new">
              <Plus className="mr-2 h-4 w-4" /> New Prescription
            </Link>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="own" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            My Prescriptions
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            Shared With Me
          </TabsTrigger>
        </TabsList>

        <TabsContent value="own" className="mt-6">
          {isLoading && <SkeletonGrid />}

          {!isLoading && data?.prescriptions?.length === 0 && <EmptyState isShared={false} />}

          {!isLoading && data?.prescriptions?.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.prescriptions.map((rx, i) => (
                <PrescriptionCard key={rx.id} rx={rx} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {isLoading && <SkeletonGrid />}

          {!isLoading && data?.prescriptions?.length === 0 && <EmptyState isShared={true} />}

          {!isLoading && data?.prescriptions?.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.prescriptions.map((rx, i) => (
                <SharedPrescriptionCard key={rx.id} rx={rx as SharedPrescription} index={i} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
