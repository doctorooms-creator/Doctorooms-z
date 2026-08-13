'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, TrendingDown, Building2, Stethoscope, CreditCard, AlertCircle, CalendarDays, BarChart3, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface DailyTrend { date: string; revenue: number; ipd: number; opd: number }
interface PaymentBreakdown { method: string; amount: number; percent: number }
interface DeptRevenue { department: string; ipdRevenue: number; opdRevenue: number; totalRevenue: number; percent?: number }
interface DocRevenue { doctorId: string; doctorName: string; ipdRevenue: number; opdRevenue: number; totalRevenue: number }
interface OutstandingBill { billNo: string; patientName: string; admissionNo: string; department: string; totalAmount: number; paid: number; outstanding: number; daysOld: number; type: string }

// ============ Helpers ============

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`

const METHOD_COLORS: Record<string, string> = {
  Cash: 'bg-emerald-500', UPI: 'bg-violet-500', 'Credit Card': 'bg-amber-500',
  'Debit Card': 'bg-sky-500', 'Net Banking': 'bg-rose-500', 'Cheque': 'bg-teal-500',
  'Insurance/TPA': 'bg-orange-500', Other: 'bg-slate-400',
}

// ============ Component ============

export default function RevenueReportClient() {
  const [period, setPeriod] = useState('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear().toString())
  const [month, setMonth] = useState((now.getMonth() + 1).toString())
  const [activeTab, setActiveTab] = useState<'overview' | 'outstanding'>('overview')

  const queryParams = `?period=${period}&year=${year}&month=${month}`

  const summaryQuery = useQuery({
    queryKey: ['report-revenue-summary', period, year, month],
    queryFn: () => fetch(`/api/reports/revenue/summary${queryParams}`).then(r => r.json()),
  })
  const deptQuery = useQuery({
    queryKey: ['report-revenue-dept', period, year, month],
    queryFn: () => fetch(`/api/reports/revenue/department-wise${queryParams}`).then(r => r.json()),
    enabled: activeTab === 'overview',
  })
  const docQuery = useQuery({
    queryKey: ['report-revenue-doc', period, year, month],
    queryFn: () => fetch(`/api/reports/revenue/doctor-wise${queryParams}`).then(r => r.json()),
    enabled: activeTab === 'overview',
  })
  const methodQuery = useQuery({
    queryKey: ['report-revenue-methods', period, year, month],
    queryFn: () => fetch(`/api/reports/revenue/payment-methods${queryParams}`).then(r => r.json()),
    enabled: activeTab === 'overview',
  })
  const outstandingQuery = useQuery({
    queryKey: ['report-revenue-outstanding'],
    queryFn: () => fetch('/api/reports/revenue/outstanding').then(r => r.json()),
    enabled: activeTab === 'outstanding',
  })
  const dailyQuery = useQuery({
    queryKey: ['report-revenue-daily', year, month],
    queryFn: () => fetch(`/api/reports/revenue/daily-collection?year=${year}&month=${month}`).then(r => r.json()),
    enabled: activeTab === 'overview',
  })

  const s = summaryQuery.data
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxTrend = useMemo(() => {
    if (!s?.dailyTrend) return 1
    return Math.max(...s.dailyTrend.map((d: DailyTrend) => d.revenue), 1)
  }, [s?.dailyTrend])

  const statCards = [
    {
      title: 'Total Revenue', value: s ? fmt(s.totalRevenue) : '—',
      change: s?.percentChange, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50',
    },
    {
      title: 'IPD Revenue', value: s ? fmt(s.ipdRevenue) : '—',
      sub: s ? `of total: ${s.totalRevenue > 0 ? ((s.ipdRevenue / s.totalRevenue) * 100).toFixed(0) : 0}%` : '',
      icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50',
    },
    {
      title: 'OPD Revenue', value: s ? fmt(s.opdRevenue) : '—',
      sub: s ? `of total: ${s.totalRevenue > 0 ? ((s.opdRevenue / s.totalRevenue) * 100).toFixed(0) : 0}%` : '',
      icon: CalendarDays, color: 'text-violet-600', bg: 'bg-violet-50',
    },
    {
      title: 'Advance Collected', value: s ? fmt(s.advanceCollected) : '—',
      icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50',
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Report</h1>
          <p className="text-muted-foreground text-sm">Track hospital revenue, collections, and outstanding bills</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          {(period === 'month' || period === 'year') && (
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { summaryQuery.refetch(); deptQuery.refetch(); docQuery.refetch(); methodQuery.refetch(); dailyQuery.refetch() }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'overview' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('overview')}>
          <BarChart3 className="mr-2 h-4 w-4" /> Overview
        </Button>
        <Button variant={activeTab === 'outstanding' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('outstanding')}>
          <AlertCircle className="mr-2 h-4 w-4" /> Outstanding
          {outstandingQuery.data && outstandingQuery.data.count > 0 && (
            <Badge variant="destructive" className="ml-2">{outstandingQuery.data.count}</Badge>
          )}
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      {card.change !== undefined && (
                        <div className="flex items-center gap-1 text-xs">
                          {card.change >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
                          <span className={card.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {Math.abs(card.change)}% vs prev period
                          </span>
                        </div>
                      )}
                      {card.sub && <p className="text-muted-foreground text-xs">{card.sub}</p>}
                    </div>
                    <div className={`rounded-lg p-2.5 ${card.bg}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Payment Method Breakdown */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Payment Methods</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {methodQuery.isLoading ? <Skeleton className="h-40 w-full" /> :
                (methodQuery.data?.methods?.length === 0 ? <p className="text-muted-foreground text-sm">No data</p> :
                methodQuery.data?.methods?.map((m: { method: string; amount: number; percent: number; count: number }) => (
                  <div key={m.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-sm ${METHOD_COLORS[m.method] || 'bg-slate-400'}`} />
                        <span>{m.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{fmt(m.amount)}</span>
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
                )))}
              </CardContent>
            </Card>

            {/* Daily Trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Daily Collection Trend</CardTitle></CardHeader>
              <CardContent>
                {summaryQuery.isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="flex items-end gap-1 h-40 overflow-x-auto">
                    {s?.dailyTrend?.map((d: DailyTrend) => (
                      <div key={d.date} className="flex flex-col items-center flex-1 min-w-[12px] group">
                        <div className="relative w-full flex flex-col items-center" style={{ height: '140px' }}>
                          <div className="absolute bottom-0 w-full max-w-[24px] flex flex-col justify-end gap-px">
                            <div
                              className="w-full rounded-t bg-amber-400 transition-all duration-300 min-h-[2px]"
                              style={{ height: d.ipd > 0 ? `${(d.ipd / maxTrend) * 100}%` : '0px' }}
                              title={`IPD: ${fmt(d.ipd)}`}
                            />
                            <div
                              className="w-full rounded-t bg-violet-400 transition-all duration-300 min-h-[2px]"
                              style={{ height: d.opd > 0 ? `${(d.opd / maxTrend) * 100}%` : '0px' }}
                              title={`OPD: ${fmt(d.opd)}`}
                            />
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 hidden sm:block">
                          {format(new Date(d.date + 'T00:00:00'), 'dd')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> IPD</div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-violet-400" /> OPD</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department-wise Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Department-wise Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {deptQuery.isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">IPD</TableHead>
                      <TableHead className="text-right">OPD</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right w-20">Share</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {deptQuery.data?.departments?.map((d: DeptRevenue, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.department}</TableCell>
                          <TableCell className="text-right">{fmt(d.ipdRevenue)}</TableCell>
                          <TableCell className="text-right">{fmt(d.opdRevenue)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(d.totalRevenue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.percent || 0}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{d.percent || 0}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {deptQuery.data?.departments?.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No revenue data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctor-wise Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Doctor-wise Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {docQuery.isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-right">IPD</TableHead>
                      <TableHead className="text-right">OPD</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {docQuery.data?.doctors?.map((d: DocRevenue, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{d.doctorName}</TableCell>
                          <TableCell className="text-right">{fmt(d.ipdRevenue)}</TableCell>
                          <TableCell className="text-right">{fmt(d.opdRevenue)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(d.totalRevenue)}</TableCell>
                        </TableRow>
                      ))}
                      {docQuery.data?.doctors?.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Outstanding Bills Tab */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Outstanding Bills</CardTitle>
                {outstandingQuery.data && (
                  <Badge variant="destructive">{fmt(outstandingQuery.data.totalOutstanding)} pending</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {outstandingQuery.isLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {outstandingQuery.data?.outstanding?.slice(0, 50).map((b: OutstandingBill, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{b.billNo}</TableCell>
                          <TableCell className="font-medium">{b.patientName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{b.type}</Badge></TableCell>
                          <TableCell className="text-sm">{b.department}</TableCell>
                          <TableCell className="text-right">{fmt(b.totalAmount)}</TableCell>
                          <TableCell className="text-right text-emerald-600">{fmt(b.paid)}</TableCell>
                          <TableCell className="text-right font-medium text-rose-600">{fmt(b.outstanding)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={b.daysOld > 30 ? 'destructive' : 'secondary'} className="text-xs">{b.daysOld}d</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {outstandingQuery.data?.outstanding?.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No outstanding bills</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
