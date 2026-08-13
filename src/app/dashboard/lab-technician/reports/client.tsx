'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, FileText, FlaskConical, Loader2, Eye, AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

// ============ Types ============

interface LabReport {
  id: string
  reportNo: string
  patientName: string
  patientAge: number
  patientGender: string
  status: string
  urgency: string
  createdAt: string
  resultEnteredAt: string | null
  verifiedAt: string | null
  testMaster: {
    name: string
    shortCode: string
    category: string
  }
}

interface LabReportDetail {
  id: string
  reportNo: string
  patientName: string
  patientAge: number
  patientGender: string
  status: string
  urgency: string
  createdAt: string
  verifiedAt: string | null
  verifiedBy: { user: { name: string } } | null
  hospital: { name: string }
  testMaster: {
    name: string
    shortCode: string
    category: string
    parameters: {
      id: string
      paramName: string
      shortCode: string
      unit: string
      normalMaleMin: number
      normalMaleMax: number
      normalFemaleMin: number
      normalFemaleMax: number
      normalChildMin: number
      normalChildMax: number
    }[]
  }
  parameterValues: {
    id: string
    value: string
    isAbnormal: boolean
    remarks: string
    testParameter: {
      paramName: string
      unit: string
    }
  }[]
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ResultEntered':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400">Result Entered</Badge>
    case 'Verified':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" />Verified</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function LabTechReportsClient() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [verifyId, setVerifyId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)

  // Fetch verified/reported reports
  const { data, isLoading } = useQuery<{ labReports: LabReport[] }>({
    queryKey: ['lab-tech-reports'],
    queryFn: () => fetch('/api/lab-reports?status=ResultEntered,Verified').then((r) => r.json()),
    refetchInterval: 15000,
  })

  const reports = data?.labReports || []

  // Report detail for view dialog
  const { data: detailData } = useQuery<{ labReport: LabReportDetail }>({
    queryKey: ['lab-report-view', viewId],
    queryFn: () => fetch(`/api/lab-reports/${viewId}`).then((r) => r.json()),
    enabled: !!viewId,
  })

  const detail = detailData?.labReport

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lab-reports/${id}/verify`, { method: 'PUT' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Report verified successfully')
      queryClient.invalidateQueries({ queryKey: ['lab-tech-reports'] })
      setVerifyId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resultEnteredReports = reports.filter((r) => r.status === 'ResultEntered')
  const verifiedReports = reports.filter((r) => r.status === 'Verified')

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Lab Reports</h1>
        <p className="text-sm text-muted-foreground">Verify and review completed lab reports</p>
      </motion.div>

      {/* Pending Verification Section */}
      {resultEnteredReports.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold">Pending Verification ({resultEnteredReports.length})</h2>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Test</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultEnteredReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.reportNo}</code></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.patientName}</p>
                        <p className="text-xs text-muted-foreground">{r.patientAge}y, {r.patientGender}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{r.testMaster.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatDate(r.resultEnteredAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setViewId(r.id)}>
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setVerifyId(r.id)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Verify
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verified Reports Section */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h2 className="font-semibold">Verified Reports ({verifiedReports.length})</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : verifiedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No verified reports yet</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Test</TableHead>
                    <TableHead className="hidden md:table-cell">Verified At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedReports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.reportNo}</code></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.patientName}</p>
                        <p className="text-xs text-muted-foreground">{r.patientAge}y, {r.patientGender}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{r.testMaster.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{formatDate(r.verifiedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setViewId(r.id)}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Confirmation */}
      <AlertDialog open={!!verifyId} onOpenChange={(open) => { if (!open) setVerifyId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify this report? Once verified, the results will be considered final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => verifyId && verifyMutation.mutate(verifyId)}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewId} onOpenChange={(open) => { if (!open) setViewId(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.reportNo} — {detail?.testMaster.name}</DialogTitle>
            <DialogDescription>
              {detail?.patientName} ({detail?.patientAge}y, {detail?.patientGender})
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Hospital:</span> <span className="ml-1 font-medium">{detail.hospital.name}</span></div>
                <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(detail.status)}</div>
                {detail.verifiedBy && (
                  <div><span className="text-muted-foreground">Verified By:</span> <span className="ml-1 font-medium">{detail.verifiedBy.user.name}</span></div>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="hidden sm:table-cell">Unit</TableHead>
                      <TableHead className="hidden sm:table-cell">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.parameterValues.map((pv) => (
                      <TableRow key={pv.id} className={pv.isAbnormal ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell className="font-medium text-sm">
                          {pv.testParameter.paramName}
                          {pv.isAbnormal && <AlertTriangle className="ml-1.5 inline h-3 w-3 text-red-500" />}
                        </TableCell>
                        <TableCell className={pv.isAbnormal ? 'font-bold text-red-600 dark:text-red-400' : 'text-sm'}>
                          {pv.value || '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{pv.testParameter.unit || '—'}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{pv.remarks || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
