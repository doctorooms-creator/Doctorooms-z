'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, IndianRupee, RefreshCw, ArrowUpRight, ArrowDownRight, Wallet, Receipt, Package } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============
interface PlData {
  year: number
  revenue: { ipd: number; opd: number; advances: number; total: number }
  expenses: { roomRent: number; services: number; lab: number; medicine: number; ot: number; other: number; purchases: number; total: number }
  tax: number; discounts: number; netProfit: number; profitMargin: number
  monthly: { month: string; revenue: number; expenses: number; profit: number }[]
}
interface AgingData {
  agingBuckets: { label: string; min: number; max: number; amount: number; count: number; percent: number }[]
  bills: { billNo: string; patientName: string; reference: string; type: string; total: number; paid: number; outstanding: number; daysOld: number; bucket: string }[]
  totalOutstanding: number
}

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`

const BUCKET_COLORS = ['bg-emerald-500', 'bg-teal-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500']

// ============ Component ============

export default function FinancialReportClient() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [activeTab, setActiveTab] = useState<'pnl' | 'aging'>('pnl')

  const plQ = useQuery({
    queryKey: ['fin-pnl', year],
    queryFn: () => fetch(`/api/reports/financial/profit-loss?year=${year}`).then(r => r.json()),
    enabled: activeTab === 'pnl',
  })
  const agingQ = useQuery({
    queryKey: ['fin-aging'],
    queryFn: () => fetch('/api/reports/financial/aging-receivable').then(r => r.json()),
    enabled: activeTab === 'aging',
  })

  const pl = plQ.data as PlData | undefined
  const aging = agingQ.data as AgingData | undefined

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxMonthly = useMemo(() => {
    if (!pl?.monthly) return 1
    return Math.max(...pl.monthly.map(m => Math.max(m.revenue, Math.abs(m.profit))), 1)
  }, [pl?.monthly])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground text-sm">Profit & Loss statement and accounts receivable aging</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2025, 2026, 2027].map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { plQ.refetch(); agingQ.refetch() }}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'pnl' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('pnl')}>
          <TrendingUp className="mr-2 h-4 w-4" /> Profit & Loss
        </Button>
        <Button variant={activeTab === 'aging' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('aging')}>
          <Wallet className="mr-2 h-4 w-4" /> Aging Receivable
          {aging?.totalOutstanding > 0 && (
            <Badge variant="destructive" className="ml-2">{fmtK(aging.totalOutstanding)}</Badge>
          )}
        </Button>
      </div>

      {activeTab === 'pnl' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* P&L Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-emerald-600">{pl ? fmt(pl.revenue.total) : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2.5"><ArrowUpRight className="h-5 w-5 text-emerald-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Total Expenses</p>
                    <p className="text-2xl font-bold text-rose-600">{pl ? fmt(pl.expenses.total) : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2.5"><ArrowDownRight className="h-5 w-5 text-rose-600" /></div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Net Profit</p>
                    <p className={`text-2xl font-bold ${(pl?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pl ? fmt(pl.netProfit) : '—'}</p>
                    <p className="text-muted-foreground text-xs">Margin: {pl?.profitMargin ?? 0}%</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${(pl?.netProfit ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {(pl?.netProfit ?? 0) >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-600" /> : <TrendingDown className="h-5 w-5 text-rose-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Expense Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Revenue Breakdown</CardTitle></CardHeader>
              <CardContent>
                {plQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-3">
                    {[
                      { label: 'IPD Revenue', value: pl?.revenue.ipd ?? 0, color: 'bg-amber-500' },
                      { label: 'OPD Revenue', value: pl?.revenue.opd ?? 0, color: 'bg-violet-500' },
                      { label: 'Advance Deposits', value: pl?.revenue.advances ?? 0, color: 'bg-emerald-500' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><div className={`h-3 w-3 rounded-sm ${item.color}`} /><span>{item.label}</span></div>
                          <span className="font-medium">{fmt(item.value)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pl?.revenue.total > 0 ? (item.value / pl.revenue.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="font-medium">Tax Collected</span><span className="text-amber-600">{fmt(pl?.tax ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Discounts Given</span><span className="text-rose-600">-{fmt(pl?.discounts ?? 0)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                {plQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
                  <div className="space-y-3">
                    {[
                      { label: 'Room Rent', value: pl?.expenses.roomRent ?? 0, color: 'bg-rose-400' },
                      { label: 'Services', value: pl?.expenses.services ?? 0, color: 'bg-amber-400' },
                      { label: 'Lab', value: pl?.expenses.lab ?? 0, color: 'bg-violet-400' },
                      { label: 'Medicine', value: pl?.expenses.medicine ?? 0, color: 'bg-emerald-400' },
                      { label: 'OT Charges', value: pl?.expenses.ot ?? 0, color: 'bg-sky-400' },
                      { label: 'Purchases (Inventory)', value: pl?.expenses.purchases ?? 0, color: 'bg-orange-400' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2"><div className={`h-3 w-3 rounded-sm ${item.color}`} /><span>{item.label}</span></div>
                          <span className="font-medium">{fmt(item.value)}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pl?.expenses.total > 0 ? (item.value / pl?.expenses.total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Monthly Trend — {year}</CardTitle></CardHeader>
            <CardContent>
              {plQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="flex items-end gap-2 h-40">
                  {pl?.monthly?.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="relative w-full flex flex-col justify-end" style={{ height: '120px' }}>
                        <div
                          className={`w-full max-w-[28px] rounded-t transition-all duration-500 ${m.profit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                          style={{ height: `${(Math.abs(m.profit) / maxMonthly) * 100}px`, minHeight: '2px' }}
                          title={`${m.month}: Rev ${fmt(m.revenue)} | Exp ${fmt(m.expenses)} | Profit ${fmt(m.profit)}`}
                        />
                        <div
                          className="w-full max-w-[28px] bg-violet-300 transition-all duration-500 mt-px"
                          style={{ height: `${(m.expenses / maxMonthly) * 100}px`, minHeight: '2px' }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{m.month}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Profit</div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-rose-400" /> Loss</div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-violet-300" /> Expenses</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Aging Receivable */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Aging Buckets */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            {aging?.agingBuckets?.map((b, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{b.label}</p>
                  <p className="text-lg font-bold mt-1">{fmt(b.amount)}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mt-2">
                    <div className={`h-full rounded-full ${BUCKET_COLORS[i]} transition-all duration-500`} style={{ width: `${b.percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.count} bills ({b.percent}%)</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bills table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Outstanding Bills by Age</CardTitle>
                <span className="text-sm text-muted-foreground">Total: {fmt(aging?.totalOutstanding ?? 0)}</span>
              </div>
            </CardHeader>
            <CardContent>
              {agingQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Bill</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                      <TableHead>Bucket</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {aging?.bills?.map((b, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{b.billNo}</TableCell>
                          <TableCell className="font-medium text-sm">{b.patientName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{b.type}</Badge></TableCell>
                          <TableCell className="text-right">{fmt(b.total)}</TableCell>
                          <TableCell className="text-right font-medium text-rose-600">{fmt(b.outstanding)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={b.daysOld > 90 ? 'destructive' : b.daysOld > 30 ? 'secondary' : 'outline'} className="text-xs">{b.daysOld}d</Badge>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{b.bucket}</Badge></TableCell>
                        </TableRow>
                      ))}
                      {aging?.bills?.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No outstanding receivables</TableCell></TableRow>
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
