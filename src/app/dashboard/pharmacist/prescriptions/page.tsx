'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FileText,
  Search,
  Calendar,
  Pill,
  Eye,
  Thermometer,
  Weight,
  Activity,
  Droplets,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PMedicine {
  id: string
  medicine: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  tab: number
  dose: string
  description: string
}

interface PLabel {
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
  medicines: PMedicine[]
  labels: PLabel[]
}

export default function PharmacistPrescriptionsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)

  const handleSearch = (value: string) => {
    setSearch(value)
    setTimeout(() => setDebouncedSearch(value), 300)
  }

  const { data, isLoading } = useQuery<{ prescriptions: Prescription[] }>({
    queryKey: ['pharmacist-prescriptions', debouncedSearch],
    queryFn: () =>
      fetch(
        `/api/dashboard/pharmacist/prescriptions?search=${encodeURIComponent(debouncedSearch)}`
      ).then((r) => r.json()),
  })

  const handleView = (rx: Prescription) => {
    setSelectedRx(rx)
    setViewOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by patient name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Prescription cards */}
      {isLoading && (
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
      )}

      {!isLoading && data?.prescriptions?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">No prescriptions found</p>
          <p className="text-sm mt-1">Prescriptions will appear here once the doctor creates them.</p>
        </div>
      )}

      {!isLoading && data?.prescriptions?.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.prescriptions.map((rx, i) => (
            <motion.div
              key={rx.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="group transition-all hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{rx.patientName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(rx.createdAt), 'MMM d, yyyy')}
                        {rx.patientAge && <span>· Age: {rx.patientAge}</span>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-teal-600 hover:text-teal-700 dark:text-teal-400"
                      onClick={() => handleView(rx)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {rx.disease && (
                    <Badge variant="secondary" className="text-xs">{rx.disease}</Badge>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Pill className="h-3 w-3" /> {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                    </span>
                    {rx.labels.length > 0 && (
                      <span>{rx.labels.length} label{rx.labels.length !== 1 ? 's' : ''}</span>
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
            </motion.div>
          ))}
        </div>
      )}

      {/* View prescription dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-5 pt-2">
              {/* Patient info */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedRx.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedRx.createdAt), 'MMMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  {selectedRx.patientAge && (
                    <Badge variant="outline">Age: {selectedRx.patientAge}</Badge>
                  )}
                </div>

                {selectedRx.disease && (
                  <div>
                    <p className="text-sm text-muted-foreground">Diagnosis</p>
                    <p className="text-sm font-medium">{selectedRx.disease}</p>
                  </div>
                )}

                {/* Vitals */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {selectedRx.weight && (
                    <div className="rounded-md bg-muted p-2.5 text-center">
                      <Weight className="mx-auto h-4 w-4 text-teal-500" />
                      <p className="mt-1 text-xs text-muted-foreground">Weight</p>
                      <p className="text-sm font-semibold">{selectedRx.weight} kg</p>
                    </div>
                  )}
                  {selectedRx.bp && (
                    <div className="rounded-md bg-muted p-2.5 text-center">
                      <Activity className="mx-auto h-4 w-4 text-teal-500" />
                      <p className="mt-1 text-xs text-muted-foreground">BP</p>
                      <p className="text-sm font-semibold">{selectedRx.bp}</p>
                    </div>
                  )}
                  {selectedRx.temperature && (
                    <div className="rounded-md bg-muted p-2.5 text-center">
                      <Thermometer className="mx-auto h-4 w-4 text-teal-500" />
                      <p className="mt-1 text-xs text-muted-foreground">Temp</p>
                      <p className="text-sm font-semibold">{selectedRx.temperature}°F</p>
                    </div>
                  )}
                  {selectedRx.labels.length > 0 && (
                    <div className="rounded-md bg-muted p-2.5 text-center">
                      <Droplets className="mx-auto h-4 w-4 text-teal-500" />
                      <p className="mt-1 text-xs text-muted-foreground">Tests</p>
                      <p className="text-sm font-semibold">{selectedRx.labels.length}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedRx.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm rounded-lg bg-muted p-3">{selectedRx.description}</p>
                </div>
              )}

              {/* Labels / Lab results */}
              {selectedRx.labels.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Lab Results & Labels</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRx.labels.map((l) => (
                      <div key={l.id} className="rounded-lg border border-border p-2.5">
                        <p className="text-xs text-muted-foreground">{l.label}</p>
                        <p className="text-sm font-medium">
                          {l.value}{l.labelUnit ? ` ${l.labelUnit}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medicines */}
              {selectedRx.medicines.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Medicines</p>
                  <div className="space-y-2">
                    {selectedRx.medicines.map((m) => (
                      <div key={m.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{m.medicine}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{m.tab} tab{m.tab !== 1 ? 's' : ''}</span>
                              {m.dose && (
                                <Badge variant="outline" className="text-[10px]">{m.dose}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {m.morning && (
                              <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                                M
                              </span>
                            )}
                            {m.afternoon && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                A
                              </span>
                            )}
                            {m.evening && (
                              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
                                E
                              </span>
                            )}
                          </div>
                        </div>
                        {m.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
