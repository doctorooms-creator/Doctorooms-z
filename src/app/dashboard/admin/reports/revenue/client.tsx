'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, IndianRupee, TrendingUp, TrendingDown, Calendar, CreditCard, Building2, Stethoscope, AlertCircle, RefreshCw, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface DailyTrend { date: string; revenue: number; ipd: number; opd: number }
interface PaymentMethod { method: string; amount: number; percent: number; count: number }
interface DeptRevenue { department: string; ipdRevenue: number; opdRevenue: number; totalRevenue: number; percent?: number }
interface DocRevenue { doctorId: string; doctorName: string; department?: string; patients?: number; ipdRevenue: number; opdRevenue: number; totalRevenue: number }
interface OutstandingBill { billNo: string; patientName: string; hospitalName?: string; admissionNo: string; department: string; totalAmount: number; paid: number; outstanding: number; daysOld: number; type: string }

// ============ Helpers ============

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
] as const

const METHOD_COLORS: Record<string, string> = {
  Cash: 'bg-emerald-500',
  UPI: 'bg-teal-500',
  'Credit Card': 'bg-amber-500',
  'Debit Card': 'bg-orange-500',
  'Net Banking': 'bg-rose-500',
  'Cheque': 'bg-slate-500',
  'Insurance/TPA': 'bg-violet-500',
  Other: 'bg-slate-400',
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
}

// ============ Component ============

export default function AdminRevenueReportsClient() {
  const [period, setPeriod] = useState('month')

  const queryParams = `?period=${period}`

  // --- Queries ---
  const summaryQuery = useQuery({
    queryKey: ['admin-revenue-summary', period],
    queryFn: () => fetch(`/api/reports/revenue/summary${queryParams}`).then(r => r.json()),
  })
  const deptQuery = useQuery({
    queryKey: ['admin-revenue-dept', period],
    queryFn: () => fetch(`/api/reports/revenue/department-wise${queryParams}`).then(r => r.json()),
  })
  const docQuery = useQuery({
    queryKey: ['admin-revenue-doc', period],
    queryFn: () => fetch(`/api/reports/revenue/doctor-wise${queryParams}`).then(r => r.json()),
  })
  const dailyQuery = useQuery({
    queryKey: ['admin-revenue-daily', period],
    queryFn: () => fetch(`/api/reports/revenue/daily-collection?days=30`).then(r => r.json()),
  })
  const methodQuery = useQuery({
    queryKey: ['admin-revenue-methods', period],
    queryFn: () => fetch(`/api/reports/revenue/payment-methods${queryParams}`).then(r => r.json()),
  })
  const outstandingQuery = useQuery({
    queryKey: ['admin-revenue-outstanding'],
    queryFn: () => fetch('/api/reports/revenue/outstanding').then(r => r.json()),
  })

  const s = summaryQuery.data
  const methods = methodQuery.data?.methods ?? []
  const departments = deptQuery.data?.departments ?? []
  const doctors = docQuery.data?.doctors ?? []
  const outstanding = outstandingQuery.data?.outstanding ?? []
  const dailyTrend = dailyQuery.data?.dailyTrend ?? s?.dailyTrend ?? []

  const maxDaily = useMemo(() => {
    if (!dailyTrend.length) return 1
    return Math.max(...dailyTrend.map((d: DailyTrend) => d.revenue), 1)
  }, [dailyTrend])

  const maxDeptRevenue = useMemo(() => {
    if (!departments.length) return 1
    return Math.max(...departments.map((d: DeptRevenue) => d.totalRevenue), 1)
  }, [departments])

  const refetchAll = () => {
    summaryQuery.refetch()
    deptQuery.refetch()
    docQuery.refetch()
    dailyQuery.refetch()
    methodQuery.refetch()
    outstandingQuery.refetch()
  }

  // --- Stat Cards ---
  const statCards = [
    {
      title: 'Total Revenue',
      value: s ? formatCurrency(s.totalRevenue) : '—',
      change: s?.percentChange,
      icon: IndianRupee,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
    },
    {
      title: 'OPD Revenue',
      value: s ? formatCurrency(s.opdRevenue) : '—',
      sub: s && s.totalRevenue > 0 ? `${((s.opdRevenue / s.totalRevenue) * 100).toFixed(0)}% of total` : undefined,
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      title: 'IPD Revenue',
      value: s ? formatCurrency(s.ipdRevenue) : '—',
      sub: s && s.totalRevenue > 0 ? `${((s.ipdRevenue / s.totalRevenue) * 100).toFixed(0)}% of total` : undefined,
      icon: Building2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      title: 'Outstanding',
      value: outstandingQuery.data ? formatCurrency(outstandingQuery.data.totalOutstanding || 0) : '—',
      change: outstandingQuery.data?.count,
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  ]

  const isLoading = summaryQuery.isLoading || methodQuery.isLoading || deptQuery.isLoading || docQuery.isLoading || outstandingQuery.isLoading || dailyQuery.isLoading

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <BarChart3 className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Revenue Reports</h1>
            <p className="text-muted-foreground text-sm">Cross-hospital financial analytics</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
            {PERIOD_OPTIONS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'ghost'}
                size="sm"
                className="text-xs"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Top Row — Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className={`overflow-hidden border-l-4 ${card.border}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    {card.change !== undefined && card.title !== 'Outstanding' && (
                      <div className="flex items-center gap-1 text-xs">
                        {card.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-rose-500" />
                        )}
                        <span className={card.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {Math.abs(card.change)}% vs prev period
                        </span>
                      </div>
                    )}
                    {card.title === 'Outstanding' && typeof card.change === 'number' && (
                      <p className="text-xs text-rose-500">{card.change} pending bill{card.change !== 1 ? 's' : ''}</p>
                    )}
                    {card.sub && <p className="text-muted-foreground text-xs">{card.sub}</p>}
                  </div>
                  <div className={`rounded-lg p-2.5 ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Second Row — Payment Methods + Daily Collection */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {methodQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : methods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard className="text-muted-foreground/30 mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No payment data available</p>
              </div>
            ) : (
              methods.map((m: PaymentMethod) => (
                <div key={m.method} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-sm ${METHOD_COLORS[m.method] || 'bg-slate-400'}`} />
                      <span>{m.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(m.amount)}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{m.percent}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${METHOD_COLORS[m.method] || 'bg-slate-400'} transition-all duration-500`}
                      style={{ width: `${m.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Daily Collection Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Daily Collection (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyQuery.isLoading && !s?.dailyTrend ? (
              <Skeleton className="h-40 w-full" />
            ) : dailyTrend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="text-muted-foreground/30 mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No daily collection data</p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {dailyTrend.map((d: DailyTrend) => {
                    const dDate = new Date(d.date + 'T00:00:00')
                    return (
                      <div key={d.date} className="flex flex-col items-center flex-1 min-w-[8px] group relative">
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow-md border">
                          <div>{dDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div className="font-medium">{formatCurrency(d.revenue)}</div>
                        </div>
                        <div className="relative w-full flex flex-col items-center" style={{ height: '140px' }}>
                          <div className="absolute bottom-0 w-full max-w-[20px] flex flex-col justify-end gap-px">
                            <div
                              className="w-full rounded-t bg-amber-400 transition-all duration-300 min-h-[2px]"
                              style={{ height: d.ipd > 0 ? `${(d.ipd / maxDaily) * 100}%` : '0px' }}
                            />
                            <div
                              className="w-full rounded-t bg-emerald-400 transition-all duration-300 min-h-[2px]"
                              style={{ height: d.opd > 0 ? `${(d.opd / maxDaily) * 100}%` : '0px' }}
                            />
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 hidden sm:block">
                          {dDate.getDate()}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> IPD
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> OPD
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row — Department-wise Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
              Department-wise Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deptQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 flex-1" />
                  </div>
                ))}
              </div>
            ) : departments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Stethoscope className="text-muted-foreground/30 mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No department revenue data</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right w-48">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((d: DeptRevenue, i: number) => {
                      const pct = d.percent ?? (d.totalRevenue > 0 && s?.totalRevenue > 0 ? (d.totalRevenue / s.totalRevenue) * 100 : 0)
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.department}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(d.totalRevenue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-teal-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-10 text-right text-xs">{pct.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fourth Row — Top 10 Doctors by Revenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              Top 10 Doctors by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {docQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="text-muted-foreground/30 mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No doctor revenue data</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="hidden sm:table-cell">Department</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Patients</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.slice(0, 10).map((d: DocRevenue, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                            {i + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{d.doctorName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{d.department || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-right">{d.patients ?? '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(d.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fifth Row — Outstanding Bills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Outstanding Bills
              </CardTitle>
              {outstandingQuery.data && outstandingQuery.data.totalOutstanding > 0 && (
                <Badge variant="destructive" className="w-fit">
                  {formatCurrency(outstandingQuery.data.totalOutstanding)} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {outstandingQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : outstanding.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="text-muted-foreground/30 mb-2 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No outstanding bills</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden sm:table-cell text-right">Days Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstanding.slice(0, 50).map((b: OutstandingBill, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{b.patientName}</p>
                            <p className="text-muted-foreground text-xs hidden sm:block">{b.department}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs font-normal">{b.hospitalName || '—'}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{b.billNo}</TableCell>
                        <TableCell className="text-right font-medium text-rose-600">{formatCurrency(b.outstanding)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-right">
                          <Badge variant={b.daysOld > 30 ? 'destructive' : b.daysOld > 14 ? 'secondary' : 'outline'} className="text-xs">
                            {b.daysOld}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
