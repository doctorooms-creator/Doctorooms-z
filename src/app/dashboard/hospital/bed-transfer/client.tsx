'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowRightLeft,
  Bed,
  BedDouble,
  Loader2,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Admission {
  id: string
  admissionNo: string
  patientName: string
  patientAge: number
  patientGender: string
  bedId: string
  wardId: string
  wardName: string
  bedNumber: string
  bedType: string
}

interface AvailableBed {
  id: string
  bedNumber: string
  bedType: string
  dailyRate: number
  wardId: string
  wardName: string
  wardType: string
  floor: number
}

interface Transfer {
  id: string
  admissionId: string
  fromBedNumber: string
  fromBedType: string
  fromWardName: string
  toBedNumber: string
  toBedType: string
  toWardName: string
  transferDate: string
  transferReason: string
  createdAt: string
}

const bedTypeColors: Record<string, string> = {
  General: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  SemiPrivate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  Private: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  ICU_Ventilator: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  ICU_NonVentilator: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
}

export default function BedTransferClient() {
  const queryClient = useQueryClient()
  const [admissionId, setAdmissionId] = useState('')
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
  const [toBedId, setToBedId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [searchedAdmission, setSearchedAdmission] = useState(false)

  // Fetch admission details
  const { data: admissionData, isLoading: admissionLoading } = useQuery<{
    admission: Admission & { fromBed?: { bedNumber: string } }
  }>({
    queryKey: ['admission-detail', admissionId],
    queryFn: () => fetch(`/api/dashboard/receptionist/ipd?admissionId=${admissionId}`).then((r) => r.json()),
    enabled: !!admissionId && searchedAdmission,
  })

  // Fetch available beds
  const { data: bedsData, isLoading: bedsLoading } = useQuery<{
    beds: AvailableBed[]
  }>({
    queryKey: ['available-beds'],
    queryFn: () => fetch('/api/dashboard/receptionist/ipd/available-beds').then((r) => r.json()),
    refetchInterval: 30000,
  })

  // Fetch transfer history for selected admission
  const { data: transfersData, isLoading: transfersLoading } = useQuery<{
    transfers: Transfer[]
  }>({
    queryKey: ['bed-transfers', admissionId],
    queryFn: () => fetch(`/api/bed-transfers?admissionId=${admissionId}`).then((r) => r.json()),
    enabled: !!selectedAdmission,
  })

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: (body: { admissionId: string; toBedId: string; transferReason: string }) =>
      fetch('/api/bed-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Patient transferred successfully')
      setSelectedAdmission(null)
      setToBedId('')
      setTransferReason('')
      setAdmissionId('')
      setSearchedAdmission(false)
      queryClient.invalidateQueries({ queryKey: ['available-beds'] })
      queryClient.invalidateQueries({ queryKey: ['bed-transfers'] })
    },
    onError: (err) => {
      const errorData = err as { message?: string }
      toast.error(errorData.message || 'Transfer failed')
    },
  })

  function handleSearch() {
    if (!admissionId) return
    setSearchedAdmission(true)
  }

  // Parse admission data from IPD list endpoint
  const admissions = admissionData?.admission ? [admissionData.admission as unknown as Admission] : []
  // Try to use the selected admission from search result
  const currentAdmission = selectedAdmission
  const availableBeds = bedsData?.beds ?? []
  const transfers = transfersData?.transfers ?? []

  // Filter out current bed from available list
  const filteredBeds = availableBeds.filter(
    (b) => currentAdmission && b.id !== currentAdmission.bedId
  )

  // Group beds by ward
  const bedsByWard: Record<string, AvailableBed[]> = {}
  for (const bed of filteredBeds) {
    if (!bedsByWard[bed.wardName]) bedsByWard[bed.wardName] = []
    bedsByWard[bed.wardName].push(bed)
  }

  return (
    <div className="space-y-6">
      {/* Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search admission */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Admission ID or Number</Label>
              <Input
                placeholder="Enter admission ID or IPD number"
                value={admissionId}
                onChange={(e) => setAdmissionId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!admissionId || admissionLoading}>
                {admissionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>

          {/* Admission info (simulated — in real app would use proper endpoint) */}
          {admissionLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {/* Transfer form fields */}
          {selectedAdmission && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-lg border p-4 bg-muted/30"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current Location</p>
                  <div className="flex items-center gap-2 mt-1">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedAdmission.bedNumber}</span>
                    <Badge className={cn('text-[10px]', bedTypeColors[selectedAdmission.bedType] || '')}>
                      {selectedAdmission.bedType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedAdmission.wardName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <p className="font-medium mt-1">{selectedAdmission.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedAdmission.patientGender}, {selectedAdmission.patientAge}y
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Transfer To (Select Available Bed)</Label>
                <Select value={toBedId} onValueChange={setToBedId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an available bed" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bedsByWard).map(([wardName, beds]) => (
                      <div key={wardName}>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          {wardName}
                        </div>
                        {beds.map((bed) => (
                          <SelectItem key={bed.id} value={bed.id}>
                            {bed.bedNumber} — {bed.bedType} (₹{bed.dailyRate}/day)
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                    {filteredBeds.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No available beds
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason for Transfer</Label>
                <Textarea
                  placeholder="e.g., Patient condition requires ICU monitoring"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    transferMutation.mutate({
                      admissionId: selectedAdmission.id,
                      toBedId,
                      transferReason,
                    })
                  }
                  disabled={!toBedId || transferMutation.isPending}
                >
                  {transferMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                  )}
                  Transfer Patient
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAdmission(null)
                    setToBedId('')
                    setTransferReason('')
                    setAdmissionId('')
                    setSearchedAdmission(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Available Beds Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Available Beds
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['available-beds'] })}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bedsLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : availableBeds.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <AlertCircle className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No available beds</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto">
              {availableBeds.slice(0, 12).map((bed) => (
                <div
                  key={bed.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{bed.bedNumber}</p>
                    <p className="text-xs text-muted-foreground">{bed.wardName}</p>
                  </div>
                  <Badge className={cn('text-[10px]', bedTypeColors[bed.bedType] || '')}>
                    {bed.bedType}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer History */}
      {selectedAdmission && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transfer History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : transfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No transfers recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    transfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">
                          {new Date(t.transferDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{t.fromBedNumber}</p>
                            <p className="text-xs text-muted-foreground">{t.fromWardName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{t.toBedNumber}</p>
                            <p className="text-xs text-muted-foreground">{t.toWardName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {t.transferReason || '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
