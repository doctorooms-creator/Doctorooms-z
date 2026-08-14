'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogOut, Search, Loader2, RefreshCw, AlertTriangle, BedDouble, User, FileText, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface AdmittedPatient {
  id: string
  admissionNo: string
  patientName: string
  patientAge: number
  patientGender: string
  wardName: string
  bedNumber: string
  doctorName: string
  admissionDate: string
  departmentName?: string
  initialDiagnosis: string
  advanceAmount?: number
  roomRentDays?: number
}

interface BillSummary {
  id?: string
  billNo?: string
  totalAmount?: number
  advanceAdjusted?: number
  netPayable?: number
  status?: string
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `\u20b9${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getDischargeTypeInfo(type: string) {
  switch (type) {
    case 'Normal':
      return {
        color: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500',
        icon: <Shield className="h-5 w-5 text-emerald-600" />,
        description: 'Patient is being discharged as per doctor\'s advice with normal recovery.',
      }
    case 'DAMA':
      return {
        color: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        description: 'Discharge Against Medical Advice — Patient/guardian is leaving against medical recommendation. Document risks.',
      }
    case 'LAMA':
      return {
        color: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-500',
        icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
        description: 'Left Against Medical Advice — Patient left without completing treatment. Ensure proper documentation.',
      }
    default:
      return {
        color: 'text-slate-600',
        border: 'border-slate-500',
        icon: null,
        description: '',
      }
  }
}

// ============ Component ============

interface ReceptionistDischargeClientProps {
  user: any
}

export default function ReceptionistDischargeClient({ user }: ReceptionistDischargeClientProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showDischargeDialog, setShowDischargeDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<AdmittedPatient | null>(null)
  const [dischargeType, setDischargeType] = useState('Normal')
  const [dischargeTime, setDischargeTime] = useState('')

  // Fetch admitted patients
  const { data, isLoading } = useQuery<{ admissions: AdmittedPatient[] }>({
    queryKey: ['ipd-admissions-admitted-discharge'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-admissions?status=Admitted&limit=200')
      if (!res.ok) throw new Error('Failed to load admissions')
      return res.json()
    },
  })

  const admissions = data?.admissions || []

  // Filter
  const filteredAdmissions = search
    ? admissions.filter(
        (a) =>
          a.patientName.toLowerCase().includes(search.toLowerCase()) ||
          a.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
          a.doctorName.toLowerCase().includes(search.toLowerCase())
      )
    : admissions

  // Discharge mutation
  const dischargeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error('No patient selected')

      const res = await fetch(`/api/ipd-admissions/${selectedPatient.id}/discharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dischargeType,
          dischargeTime: dischargeTime || new Date().toTimeString().slice(0, 5),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to discharge patient')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Patient discharged successfully. Bill: ${data.billNo}`)
      setShowDischargeDialog(false)
      setSelectedPatient(null)
      setDischargeType('Normal')
      setDischargeTime('')
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const dischargeTypeInfo = getDischargeTypeInfo(dischargeType)

  function openDischargeDialog(patient: AdmittedPatient) {
    setSelectedPatient(patient)
    setDischargeType('Normal')
    setDischargeTime('')
    setShowDischargeDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <LogOut className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Patient Discharge</h1>
            <p className="text-sm text-muted-foreground">Manage IPD patient discharge flow</p>
          </div>
        </div>
        <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 w-fit">
          {admissions.length} Currently Admitted
        </Badge>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, admission no, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ipd-admissions-admitted-discharge'] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Admitted Patients Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAdmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead>Ward / Bed</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAdmissions.map((adm) => (
                      <motion.tr
                        key={adm.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">{adm.admissionNo}</TableCell>
                        <TableCell className="font-medium">{adm.patientName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {adm.patientAge}Y / {adm.patientGender}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <BedDouble className="h-3 w-3 mr-1" />
                            {adm.wardName}-{adm.bedNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{adm.doctorName}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {adm.initialDiagnosis || '\u2014'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {adm.roomRentDays || '\u2014'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            className="gap-2 bg-rose-600 hover:bg-rose-700"
                            size="sm"
                            onClick={() => openDischargeDialog(adm)}
                          >
                            <LogOut className="h-4 w-4" />
                            Discharge
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <LogOut className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No admitted patients found</p>
              {search && <p className="text-sm mt-1">Try a different search term</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discharge Dialog */}
      <Dialog open={showDischargeDialog} onOpenChange={setShowDischargeDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-rose-600" />
              Discharge Patient
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4 py-2">
              {/* Patient Summary */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedPatient.patientName}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {selectedPatient.admissionNo}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {selectedPatient.wardName} - {selectedPatient.bedNumber}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Dr. {selectedPatient.doctorName}
                    </div>
                  </div>
                  {selectedPatient.initialDiagnosis && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Diagnosis:</span> {selectedPatient.initialDiagnosis}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Discharge Type */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Discharge Type</label>
                <Select value={dischargeType} onValueChange={setDischargeType}>
                  <SelectTrigger className={dischargeTypeInfo.border}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal Discharge</SelectItem>
                    <SelectItem value="DAMA">DAMA (Against Medical Advice)</SelectItem>
                    <SelectItem value="LAMA">LAMA (Left Against Medical Advice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warning for DAMA/LAMA */}
              {(dischargeType === 'DAMA' || dischargeType === 'LAMA') && (
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    {dischargeType === 'DAMA'
                      ? 'DAMA: Patient/guardian is leaving against medical advice. Ensure proper documentation and acknowledgment of risks.'
                      : 'LAMA: Patient left without authorization. Document circumstances and notify the attending doctor.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Bill Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advance Deposited</span>
                    <span className="font-mono text-emerald-600">
                      {formatCurrency(selectedPatient.advanceAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Rent Days</span>
                    <span className="font-mono">{selectedPatient.roomRentDays || 'Auto-calculated'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    A bill will be auto-generated (if not exists) and finalized during discharge.
                  </p>
                </CardContent>
              </Card>

              {/* Discharge Time */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Discharge Time (Optional)</label>
                <Input
                  type="time"
                  value={dischargeTime}
                  onChange={(e) => setDischargeTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for current time</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDischargeDialog(false)}>Cancel</Button>
            <Button
              className={
                dischargeType === 'Normal'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : dischargeType === 'DAMA'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-orange-600 hover:bg-orange-700'
              }
              disabled={dischargeMutation.isPending}
              onClick={() => dischargeMutation.mutate()}
            >
              {dischargeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Discharge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}