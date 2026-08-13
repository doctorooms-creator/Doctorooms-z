'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BedDouble,
  RefreshCw,
  Activity,
  UtensilsCrossed,
  Receipt,
  ShieldAlert,
  User,
  Building2,
  Stethoscope,
  Thermometer,
  Heart,
  Wind,
  Droplets,
  Clock,
  Phone,
  AlertTriangle,
  CalendarDays,
  Layers,
} from 'lucide-react'
import { format } from 'date-fns'

interface VitalRecord {
  recordedAt: string
  temperature: number
  pulse: number
  spo2: number
  bpSystolic: number
  bpDiastolic: number
  respiratoryRate: number
  patientStatus: string
  oxygenLiters: number
  remarks: string
}

interface DietOrder {
  dietType: string
  mealType: string
  instructions: string
  startDate: string
  status: string
}

interface Bill {
  billNo: string
  roomRentAmount: number
  serviceAmount: number
  labAmount: number
  medicineAmount: number
  otAmount: number
  otherAmount: number
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  advanceAdjusted: number
  netPayable: number
  status: string
  generatedAt: string
}

interface PortalData {
  patientName: string
  ward: string
  wardType: string
  bed: string
  bedType: string
  department: string
  attendingDoctor: string
  admitDate: string
  status: string
  hospitalName: string
  hospitalPhone: string
  canViewVitals: boolean
  canViewDiet: boolean
  canViewBill: boolean
  vitals?: VitalRecord[]
  dietOrders?: DietOrder[]
  bill?: Bill
}

interface PortalClientProps {
  accessCode: Promise<string>
}

const STATUS_COLORS: Record<string, string> = {
  Admitted: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Discharged: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  DAMA: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Expired: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  Transferred: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
}

const VITAL_CONFIG = [
  { key: 'temperature' as const, label: 'Temp', unit: '°C', icon: Thermometer, min: 36, max: 38, normal: true },
  { key: 'pulse' as const, label: 'Pulse', unit: 'bpm', icon: Heart, min: 60, max: 100, normal: true },
  { key: 'spo2' as const, label: 'SpO2', unit: '%', icon: Wind, min: 95, max: 100, normal: true },
  { key: 'bpSystolic' as const, label: 'BP', unit: 'mmHg', icon: Droplets, min: 90, max: 140, normal: true, extra: 'bpDiastolic' as const },
]

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${Math.floor(diffHrs / 24)}d ago`
}

export default function FamilyPortalClient({ accessCode: accessCodePromise }: PortalClientProps) {
  const [accessCode, setAccessCode] = useState<string>('')
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    accessCodePromise.then(setAccessCode)
  }, [accessCodePromise])

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery<PortalData>({
    queryKey: ['family-portal', accessCode],
    queryFn: () =>
      fetch(`/api/family-access/${accessCode}`).then((r) => {
        if (r.status === 404) throw new Error('invalid')
        if (r.status === 410) throw new Error('revoked')
        if (!r.ok) throw new Error('error')
        return r.json()
      }),
    enabled: !!accessCode,
    refetchInterval: 30000,
    retry: false,
  })

  // Handle errors
  useEffect(() => {
    if (isError) {
      setPortalError('error')
    }
  }, [isError])

  // Error states
  if (portalError === 'invalid' || (data as Record<string, unknown>)?.error === 'Invalid access code') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="rounded-full bg-red-100 p-4 mx-auto w-fit mb-4 dark:bg-red-950">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Access Code</h2>
            <p className="text-sm text-muted-foreground">
              The access code you entered is not valid. Please check the code and try again, or contact the hospital reception.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (portalError === 'revoked' || (data as Record<string, unknown>)?.error === 'This access code has been revoked') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="rounded-full bg-orange-100 p-4 mx-auto w-fit mb-4 dark:bg-orange-950">
              <ShieldAlert className="h-8 w-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Access Revoked</h2>
            <p className="text-sm text-muted-foreground">
              This access code has been revoked by the hospital. If you believe this is an error, please contact the hospital reception.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading
  if (isLoading || !data || !accessCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const latestVital = data.vitals?.[0]
  const lastRefresh = dataUpdatedAt ? timeAgo(new Date(dataUpdatedAt).toISOString()) : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-950">
              <BedDouble className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Patient Status</h1>
              <p className="text-xs text-muted-foreground">Family Portal — {data.hospitalName}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Auto-refresh indicator */}
        {lastRefresh && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {lastRefresh} · Auto-refreshes every 30s
          </p>
        )}

        {/* Patient Info Card */}
        <Card className="border-teal-200 dark:border-teal-800">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-teal-100 p-3 dark:bg-teal-950">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{data.patientName}</h2>
                  <p className="text-sm text-muted-foreground">{data.department}</p>
                </div>
              </div>
              <Badge className={STATUS_COLORS[data.status] || ''}>{data.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>{data.ward} — {data.bed}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                <span>{data.attendingDoctor}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>Admitted: {format(new Date(data.admitDate), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{data.wardType}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitals Section */}
        {data.canViewVitals && data.vitals && data.vitals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-rose-500" />
                Vitals
                {latestVital && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    Last recorded: {timeAgo(latestVital.recordedAt)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Latest Vitals Grid */}
              {latestVital && (
                <div className="grid grid-cols-2 gap-3">
                  {VITAL_CONFIG.map((v) => {
                    const value = latestVital[v.key]
                    const isAbnormal = v.key === 'bpSystolic'
                      ? value < 90 || value > 140 || latestVital.bpDiastolic < 60 || latestVital.bpDiastolic > 90
                      : v.key === 'temperature'
                        ? value < 36 || value > 38
                        : v.key === 'pulse'
                          ? value < 60 || value > 100
                          : value < 95

                    return (
                      <div
                        key={v.key}
                        className={`rounded-lg border p-3 ${
                          isAbnormal
                            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <v.icon className={`h-4 w-4 ${isAbnormal ? 'text-red-500' : 'text-muted-foreground'}`} />
                          <span className="text-xs text-muted-foreground">{v.label}</span>
                        </div>
                        <p className={`text-lg font-bold ${isAbnormal ? 'text-red-600' : ''}`}>
                          {v.key === 'bpSystolic'
                            ? `${value}/${latestVital.bpDiastolic}`
                            : `${value}`}
                          <span className="text-xs font-normal text-muted-foreground ml-1">{v.unit}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Vitals History (last 10) */}
              {data.vitals.length > 1 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Recent Readings</p>
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          <th className="p-2 text-left">Time</th>
                          <th className="p-2 text-right">Temp</th>
                          <th className="p-2 text-right">Pulse</th>
                          <th className="p-2 text-right">SpO2</th>
                          <th className="p-2 text-right">BP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.vitals.map((v, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2 text-muted-foreground">{format(new Date(v.recordedAt), 'dd MMM HH:mm')}</td>
                            <td className={`p-2 text-right font-mono ${v.temperature < 36 || v.temperature > 38 ? 'text-red-600 font-bold' : ''}`}>
                              {v.temperature}°
                            </td>
                            <td className={`p-2 text-right font-mono ${v.pulse < 60 || v.pulse > 100 ? 'text-red-600 font-bold' : ''}`}>
                              {v.pulse}
                            </td>
                            <td className={`p-2 text-right font-mono ${v.spo2 < 95 ? 'text-red-600 font-bold' : ''}`}>
                              {v.spo2}%
                            </td>
                            <td className="p-2 text-right font-mono">
                              {v.bpSystolic}/{v.bpDiastolic}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Diet Section */}
        {data.canViewDiet && data.dietOrders && data.dietOrders.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UtensilsCrossed className="h-4 w-4 text-amber-500" />
                Diet Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.dietOrders.map((diet, i) => (
                <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{diet.dietType || 'Regular'}</span>
                      <Badge variant="outline" className="text-xs">{diet.mealType}</Badge>
                    </div>
                    {diet.instructions && (
                      <p className="text-xs text-muted-foreground">{diet.instructions}</p>
                    )}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Bill Summary */}
        {data.canViewBill && data.bill && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-violet-500" />
                Bill Summary
                <Badge variant="outline" className="ml-auto text-xs">{data.bill.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Rent</span>
                  <span className="font-mono">{formatCurrency(data.bill.roomRentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-mono">{formatCurrency(data.bill.serviceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lab / Investigations</span>
                  <span className="font-mono">{formatCurrency(data.bill.labAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medicines</span>
                  <span className="font-mono">{formatCurrency(data.bill.medicineAmount)}</span>
                </div>
                {data.bill.otAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operation Theater</span>
                    <span className="font-mono">{formatCurrency(data.bill.otAmount)}</span>
                  </div>
                )}
                {data.bill.otherAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Charges</span>
                    <span className="font-mono">{formatCurrency(data.bill.otherAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(data.bill.subtotal)}</span>
                </div>
                {data.bill.taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-mono">{formatCurrency(data.bill.taxAmount)}</span>
                  </div>
                )}
                {data.bill.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(data.bill.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Net Payable</span>
                  <span className="font-mono text-teal-700 dark:text-teal-400">{formatCurrency(data.bill.netPayable)}</span>
                </div>
                {data.bill.advanceAdjusted > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Advance Adjusted</span>
                    <span className="font-mono">-{formatCurrency(data.bill.advanceAdjusted)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No access sections message */}
        {!data.canViewVitals && !data.canViewDiet && !data.canViewBill && (
          <Card>
            <CardContent className="p-6 text-center">
              <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Additional view permissions have not been granted for this access code.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Contact the hospital reception for more information.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center space-y-2">
 {data.hospitalPhone && (
            <a
              href={`tel:${data.hospitalPhone}`}
              className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400"
            >
              <Phone className="h-4 w-4" />
              {data.hospitalPhone}
            </a>
          )}
          <p className="text-xs text-muted-foreground">
            This portal shows limited patient information for family viewing only.
          </p>
          <p className="text-xs text-muted-foreground">
            {data.hospitalName}
          </p>
        </footer>
      </div>
    </div>
  )
}
