'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FlaskConical, Clock, CheckCircle, AlertTriangle, Zap, IndianRupee, RefreshCw, FileText, Timer } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============
interface SummaryData {
  totalReports: number; ordered: number; collected: number; processing: number; verified: number; urgent: number
  totalRevenue: number
  categories: { category: string; count: number; revenue: number }[]
  topTests: { name: string; count: number }[]
}
interface TatData {
  overallAvgTatMinutes: number; overallAvgTatHours: number
  totalVerified: number; within4Hours: number; within4HoursPercent: number
  testTat: { testName: string; avgTatMinutes: number; avgTatHours: number; minTatMinutes: number; maxTatMinutes: number; sampleSize: number }[]
  categoryTat: { category: string; avgTatMinutes: number; avgTatHours: number; sampleSize: number }[]
}

const fmt = (n: number) => `\u20b9${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 100000 ? `\u20b9${(n / 100000).toFixed(1)}L` : n >= 1000 ? `\u20b9${(n / 1000).toFixed(1)}K` : `\u20b9${n}`

const CAT_COLORS = ['bg-emerald-500','bg-teal-500','bg-amber-500','bg-rose-500','bg-violet-500','bg-sky-500','bg-orange-500']

// ============ Component ============

export default function LabReportClient() {
  const [period, setPeriod] = useState('month')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear().toString())
  const [month, setMonth] = useState((now.getMonth() + 1).toString())
  const [activeTab, setActiveTab] = useState<'summary' | 'tatl'>('summary')

  const qp = `?period=${period}&year=${year}&month=${month}`

  const summaryQ = useQuery({
    queryKey: ['lab-summary', period, year, month],
    queryFn: () => fetch(`/api/reports/lab/summary${qp}`).then(r => r.json()),
    enabled: activeTab === 'summary',
  })
  const tatQ = useQuery({
    queryKey: ['lab-tatl', year, month],
    queryFn: () => fetch(`/api/reports/lab/tatl?year=${year}&month=${month}`).then(r => r.json()),
    enabled: activeTab === 'tatl',
  })

  const s = summaryQ.data as SummaryData | undefined
  const t = tatQ.data as TatData | undefined

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxCat = useMemo(() => {
    if (!s?.categories) return 1
    return Math.max(...s.categories.map(c => c.count), 1)
  }, [s?.categories])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxTatTest = useMemo(() => {
    if (!t?.testTat) return 1
    return Math.max(...t.testTat.map(tt => tt.avgTatMinutes), 1)
  }, [t?.testTat])

  const stats = [
    { title: 'Total Reports', value: s?.totalReports ?? '—', icon: FlaskConical, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Verified', value: s?.verified ?? '—', icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50', sub: s ? `${s.totalReports > 0 ? Math.round((s.verified / s.totalReports) * 100) : 0}% of total` : '' },
    { title: 'Revenue', value: s ? fmtK(s.totalRevenue) : '—', icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Urgent', value: s?.urgent ?? '—', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  const refresh = () => { summaryQ.refetch(); tatQ.refetch() }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab Reports</h1>
          <p className="text-muted-foreground text-sm">Laboratory test volumes, revenue, and turnaround times</p>
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
            <SelectContent>{[2025, 2026, 2027].map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'summary' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('summary')}>
          <FileText className="mr-2 h-4 w-4" /> Summary
        </Button>
        <Button variant={activeTab === 'tatl' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('tatl')}>
          <Timer className="mr-2 h-4 w-4" /> Turnaround Time
        </Button>
      </div>

      {activeTab === 'summary' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((card, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      {card.sub && <p className="text-muted-foreground text-xs">{card.sub}</p>}
                    </div>
                    <div className={`rounded-lg p-2.5 ${card.bg}`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><FlaskConical className="h-3.5 w-3.5 text-amber-500" /> Ordered: {s?.ordered ?? 0}</Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><FlaskConical className="h-3.5 w-3.5 text-teal-500" /> Collected: {s?.collected ?? 0}</Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5"><FlaskConical className="h-3.5 w-3.5 text-violet-500" /> Processing: {s?.processing ?? 0}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Breakdown */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Tests by Category</CardTitle></CardHeader>
              <CardContent>
                {summaryQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {s?.categories?.map((cat, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-sm ${CAT_COLORS[i % CAT_COLORS.length]}`} />
                            <span className="font-medium truncate max-w-[120px]">{cat.category}</span>
                            <span className="text-muted-foreground text-xs">{cat.count}</span>
                          </div>
                          <span className="text-xs font-medium">{fmt(cat.revenue)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${CAT_COLORS[i % CAT_COLORS.length]} transition-all duration-500`} style={{ width: `${(cat.count / maxCat) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {s?.categories?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No data</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Tests */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Top Tests</CardTitle></CardHeader>
              <CardContent>
                {summaryQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto">
                    {s?.topTests?.map((test, i) => {
                      const maxCount = s.topTests[0]?.count || 1
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[150px]">{test.name}</span>
                            <span className="font-medium text-xs">{test.count}</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${(test.count / maxCount) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    {s?.topTests?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No data</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        /* TAT Tab */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* TAT Overview Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Avg TAT</p>
                <p className="text-2xl font-bold text-emerald-600">{t ? `${t.overallAvgTatHours}h` : '—'}</p>
                <p className="text-muted-foreground text-xs">{t?.totalVerified ?? 0} verified reports</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Within 4 Hours</p>
                <p className="text-2xl font-bold text-violet-600">{t?.within4HoursPercent ?? 0}%</p>
                <p className="text-muted-foreground text-xs">{t?.within4Hours ?? 0} of {t?.totalVerified ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Target SLA</p>
                <p className="text-2xl font-bold text-amber-600">4h</p>
                <p className="text-muted-foreground text-xs">Industry standard</p>
              </CardContent>
            </Card>
          </div>

          {/* TAT by Test */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Turnaround Time by Test</CardTitle>
            </CardHeader>
            <CardContent>
              {tatQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Test Name</TableHead>
                      <TableHead className="text-right">Samples</TableHead>
                      <TableHead className="text-right">Avg TAT</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right w-24">Bar</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {t?.testTat?.map((tt, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium text-sm">{tt.testName}</TableCell>
                          <TableCell className="text-right text-xs">{tt.sampleSize}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={tt.avgTatMinutes <= 240 ? 'default' : 'destructive'} className="text-xs">
                              {tt.avgTatHours}h ({tt.avgTatMinutes}m)
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{tt.minTatMinutes}m</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{tt.maxTatMinutes}m</TableCell>
                          <TableCell className="text-right">
                            <div className="ml-auto h-2 w-16 overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${tt.avgTatMinutes <= 240 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min((tt.avgTatMinutes / maxTatTest) * 100, 100)}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {t?.testTat?.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No verified reports in this period</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TAT by Category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg TAT by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {tatQ.isLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-3">
                  {t?.categoryTat?.map((ct, i) => {
                    const maxCatTat = Math.max(...(t.categoryTat.map(c => c.avgTatMinutes)), 1)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-sm ${CAT_COLORS[i % CAT_COLORS.length]}`} />
                            <span className="font-medium">{ct.category}</span>
                            <span className="text-muted-foreground text-xs">n={ct.sampleSize}</span>
                          </div>
                          <span className="font-medium">{ct.avgTatHours}h</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${ct.avgTatMinutes <= 240 ? 'bg-emerald-500' : 'bg-rose-500'} transition-all duration-500`} style={{ width: `${(ct.avgTatMinutes / maxCatTat) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {t?.categoryTat?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
