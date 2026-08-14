'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, Search, Eye, AlertTriangle, FlaskConical } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
  }
  parameterValues: {
    id: string
    value: string
    isAbnormal: boolean
    remarks: string
    testParameter: {
      paramName: string
      shortCode: string
      unit: string
      normalMaleMin: number
      normalMaleMax: number
      normalFemaleMin: number
      normalFemaleMax: number
      normalChildMin: number
      normalChildMax: number
    }
  }[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Ordered':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Ordered</Badge>
    case 'SampleCollected':
      return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">Collected</Badge>
    case 'ResultEntered':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400">Result Entered</Badge>
    case 'Verified':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Verified</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function getNormalRange(pv: LabReportDetail['parameterValues'][0], gender: string) {
  if (gender?.toLowerCase() === 'female') {
    return { min: pv.testParameter.normalFemaleMin, max: pv.testParameter.normalFemaleMax }
  }
  return { min: pv.testParameter.normalMaleMin, max: pv.testParameter.normalMaleMax }
}

export default function DoctorLabResultsClient() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Verified')
  const [viewId, setViewId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ labReports: LabReport[] }>({
    queryKey: ['doctor-lab-reports', statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('patientName', search)
      return fetch(`/api/lab-reports?${params}`).then((r) => r.json())
    },
    refetchInterval: 30000,
  })

  const reports = data?.labReports || []

  // Report detail for view dialog
  const { data: detailData } = useQuery<{ labReport: LabReportDetail }>({
    queryKey: ['lab-report-doctor-view', viewId],
    queryFn: () => fetch(`/api/lab-reports/${viewId}`).then((r) => r.json()),
    enabled: !!viewId,
  })

  const detail = detailData?.labReport

  // Count abnormal values
  const abnormalCount = detail?.parameterValues.filter((pv) => pv.isAbnormal).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Lab Results</h1>
          <p className="text-sm text-muted-foreground">View your patients' lab test results</p>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Status</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="ResultEntered">Result Entered</SelectItem>
                <SelectItem value="SampleCollected">Sample Collected</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FlaskConical className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No lab results found</p>
              <p className="text-xs text-muted-foreground">Results from your ordered tests will appear here</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Test</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.reportNo}</code></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.patientName}</p>
                        <p className="text-xs text-muted-foreground">{r.patientAge}y, {r.patientGender}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <p className="text-sm">{r.testMaster.name}</p>
                        {r.testMaster.category && <p className="text-xs text-muted-foreground">{r.testMaster.category}</p>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
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

      {/* View Report Dialog */}
      <Dialog open={!!viewId} onOpenChange={(open) => { if (!open) setViewId(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail?.reportNo} — {detail?.testMaster.name}
              {abnormalCount > 0 && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">
                  <AlertTriangle className="mr-1 h-3 w-3" /> {abnormalCount} abnormal
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {detail?.patientName} ({detail?.patientAge}y, {detail?.patientGender})
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div><span className="text-muted-foreground">Hospital:</span> <span className="ml-1 font-medium">{detail.hospital.name}</span></div>
                <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(detail.status)}</div>
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-1 text-muted-foreground">{formatDate(detail.createdAt)}</span></div>
                {detail.verifiedBy && (
                  <div><span className="text-muted-foreground">Verified By:</span> <span className="ml-1 font-medium">{detail.verifiedBy.user.name}</span></div>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {detail.parameterValues.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No parameter values recorded yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="hidden sm:table-cell">Normal Range</TableHead>
                        <TableHead className="hidden sm:table-cell">Unit</TableHead>
                        <TableHead className="hidden md:table-cell">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.parameterValues.map((pv) => {
                        const range = getNormalRange(pv, detail.patientGender)
                        return (
                          <TableRow key={pv.id} className={pv.isAbnormal ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                            <TableCell className="font-medium text-sm">
                              {pv.testParameter.paramName}
                              {pv.isAbnormal && <AlertTriangle className="ml-1.5 inline h-3 w-3 text-red-500" />}
                            </TableCell>
                            <TableCell className={pv.isAbnormal ? 'font-bold text-red-600 dark:text-red-400' : 'text-sm'}>
                              {pv.value || '—'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                              {range.min || range.max ? `${range.min} – ${range.max}` : '—'}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{pv.testParameter.unit || '—'}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{pv.remarks || '—'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
