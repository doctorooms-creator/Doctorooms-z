'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Save, AlertTriangle, CheckCircle2, User, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// ============ Types ============

interface TestParameter {
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
  sortOrder: number
}

interface ParameterValue {
  id: string
  value: string
  isAbnormal: boolean
  remarks: string
  testParameter: TestParameter
}

interface LabReport {
  id: string
  reportNo: string
  patientName: string
  patientAge: number
  patientGender: string
  status: string
  urgency: string
  notes: string
  createdAt: string
  testMaster: {
    id: string
    name: string
    shortCode: string
    category: string
  }
  hospital: {
    name: string
  }
  parameterValues: ParameterValue[]
}

interface FormRow {
  parameterValueId: string
  parameterId: string
  paramName: string
  shortCode: string
  unit: string
  value: string
  remarks: string
  normalMin: number
  normalMax: number
}

function getNormalRange(param: TestParameter, gender: string, age: number) {
  let min = 0
  let max = 0
  if (gender?.toLowerCase() === 'female') {
    min = param.normalFemaleMin
    max = param.normalFemaleMax
  } else if (age < 14) {
    min = param.normalChildMin
    max = param.normalChildMax
  } else {
    min = param.normalMaleMin
    max = param.normalMaleMax
  }
  return { min, max }
}

function isValueAbnormal(value: string, min: number, max: number): boolean {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  if (min === 0 && max === 0) return false
  return num < min || num > max
}

// ============ Component ============

export default function ResultEntryClient() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const reportId = params.id as string

  const [formRows, setFormRows] = useState<FormRow[]>([])

  // Fetch report detail
  const { data, isLoading, error } = useQuery<{ labReport: LabReport }>({
    queryKey: ['lab-report-detail', reportId],
    queryFn: () => fetch(`/api/lab-reports/${reportId}`).then((r) => r.json()),
    enabled: !!reportId,
  })

  const report = data?.labReport

  // Initialize form rows when data loads
  useEffect(() => {
    if (report?.parameterValues) {
      const rows: FormRow[] = report.parameterValues.map((pv) => {
        const { min, max } = getNormalRange(pv.testParameter, report.patientGender, report.patientAge)
        return {
          parameterValueId: pv.id,
          parameterId: pv.testParameter.id,
          paramName: pv.testParameter.paramName,
          shortCode: pv.testParameter.shortCode,
          unit: pv.testParameter.unit,
          value: pv.value || '',
          remarks: pv.remarks || '',
          normalMin: min,
          normalMax: max,
        }
      })
      setFormRows(rows)
    }
  }, [report])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = formRows.map((row) => ({
        parameterId: row.parameterValueId,
        value: row.value,
        remarks: row.remarks,
      }))
      const res = await fetch(`/api/lab-reports/${reportId}/enter-result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Results saved successfully')
      queryClient.invalidateQueries({ queryKey: ['lab-report-detail', reportId] })
      queryClient.invalidateQueries({ queryKey: ['lab-worklist'] })
      router.push('/dashboard/lab-technician/worklist')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function updateRow(index: number, field: 'value' | 'remarks', val: string) {
    const updated = [...formRows]
    updated[index] = { ...updated[index], [field]: val }
    setFormRows(updated)
  }

  function hasAbnormalValues() {
    return formRows.some(
      (row) => row.value && isValueAbnormal(row.value, row.normalMin, row.normalMax)
    )
  }

  function hasEmptyValues() {
    return formRows.some((row) => !row.value.trim())
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-3 h-12 w-12 text-red-400" />
        <p className="text-sm text-muted-foreground">Report not found or error loading</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/lab-technician/worklist')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Worklist
        </Button>
      </div>
    )
  }

  if (report.status === 'Verified') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" />
        <p className="font-medium">This report has already been verified</p>
        <p className="text-sm text-muted-foreground">Report: {report.reportNo}</p>
      </div>
    )
  }

  if (report.status === 'ResultEntered') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/lab-technician/worklist')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{report.reportNo} — Results Already Entered</h1>
        </div>
        <p className="text-sm text-muted-foreground">This report is awaiting verification.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/lab-technician/worklist')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{report.reportNo} — Result Entry</h1>
            <p className="text-sm text-muted-foreground">{report.testMaster.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report.urgency === 'Urgent' && (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="mr-1 h-3 w-3" /> Urgent
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Patient & Test Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-medium text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-teal-500" />
                {report.patientName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Age / Gender</p>
              <p className="font-medium text-sm">{report.patientAge}y / {report.patientGender}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Test</p>
              <p className="font-medium text-sm flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-teal-500" />
                {report.testMaster.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Hospital</p>
              <p className="font-medium text-sm">{report.hospital.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Result Entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parameter Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {formRows.map((row, idx) => {
            const abnormal = row.value ? isValueAbnormal(row.value, row.normalMin, row.normalMax) : false
            return (
              <motion.div
                key={row.parameterValueId}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={abnormal
                  ? 'rounded-lg border-2 border-red-300 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20'
                  : 'rounded-lg border p-3'
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Parameter Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{row.paramName}</span>
                      {row.shortCode && (
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">{row.shortCode}</code>
                      )}
                      {abnormal && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Normal: {row.normalMin} – {row.normalMax} {row.unit}</span>
                      {row.unit && <span>({report.patientGender === 'Female' ? 'Female' : report.patientAge < 14 ? 'Child' : 'Male'} range)</span>}
                    </div>
                  </div>

                  {/* Value Input */}
                  <div className="flex items-center gap-2">
                    <div className="w-28">
                      <Input
                        type="text"
                        value={row.value}
                        onChange={(e) => updateRow(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className={abnormal ? 'border-red-400 focus-visible:ring-red-400 h-9 text-sm' : 'h-9 text-sm'}
                      />
                    </div>
                    {row.unit && (
                      <span className="text-sm text-muted-foreground w-16">{row.unit}</span>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="w-full sm:w-36">
                    <Input
                      type="text"
                      value={row.remarks}
                      onChange={(e) => updateRow(idx, 'remarks', e.target.value)}
                      placeholder="Remarks"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          {hasAbnormalValues() && (
            <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Some values are outside normal range
            </p>
          )}
          {hasEmptyValues() && (
            <p className="text-sm text-muted-foreground">Some parameters have no value entered</p>
          )}
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" /> Save Results
        </Button>
      </div>
    </div>
  )
}
