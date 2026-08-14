'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, AlertTriangle, TrendingUp, ShoppingCart, RefreshCw, Clock, ArrowDownRight, DollarSign } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============
interface SummaryData {
  totalItems: number; activeItems: number; lowStockCount: number; outOfStockCount: number
  nearExpiryCount: number; totalStockValue: number; totalCostValue: number; potentialProfit: number
  categories: { category: string; itemCount: number; totalStock: number; stockValue: number }[]
  openPurchaseOrders: number
}
interface ConsumptionData {
  topConsumed: { name: string; category: string; unit: string; qty: number; value: number }[]
  movementTypes: { type: string; count: number; quantity: number }[]
  totalMovements: number
}

const fmt = (n: number) => `\u20b9${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtK = (n: number) => n >= 100000 ? `\u20b9${(n / 100000).toFixed(1)}L` : n >= 1000 ? `\u20b9${(n / 1000).toFixed(1)}K` : `\u20b9${n}`

// ============ Component ============

export default function InventoryReportClient() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString())

  const summaryQ = useQuery({
    queryKey: ['inv-summary'],
    queryFn: () => fetch('/api/reports/inventory/summary').then(r => r.json()),
  })
  const consumptionQ = useQuery({
    queryKey: ['inv-consumption', year, month],
    queryFn: () => fetch(`/api/reports/inventory/consumption?year=${year}&month=${month}`).then(r => r.json()),
  })

  const s = summaryQ.data as SummaryData | undefined
  const c = consumptionQ.data as ConsumptionData | undefined

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxCat = useMemo(() => {
    if (!s?.categories) return 1
    return Math.max(...s.categories.map(cat => cat.stockValue), 1)
  }, [s?.categories])

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const maxConsumed = useMemo(() => {
    if (!c?.topConsumed) return 1
    return Math.max(...c.topConsumed.map(item => item.qty), 1)
  }, [c?.topConsumed])

  const stats = [
    { title: 'Total Items', value: s?.totalItems ?? '—', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${s?.activeItems ?? 0} active` },
    { title: 'Stock Value', value: s ? fmtK(s.totalStockValue) : '—', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', sub: `cost: ${s ? fmtK(s.totalCostValue) : '—'}` },
    { title: 'Low Stock Alerts', value: s?.lowStockCount ?? '—', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', sub: `${s?.outOfStockCount ?? 0} out of stock` },
    { title: 'Open POs', value: s?.openPurchaseOrders ?? '—', icon: ShoppingCart, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  const refresh = () => { summaryQ.refetch(); consumptionQ.refetch() }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Reports</h1>
          <p className="text-muted-foreground text-sm">Stock levels, consumption, and purchase order status</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{[2025, 2026, 2027].map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

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

      {/* Potential profit banner */}
      {s && s.potentialProfit > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="text-emerald-800">Potential margin on current stock: <strong>{fmt(s.potentialProfit)}</strong></span>
        </div>
      )}

      {/* Near expiry alert */}
      {s && s.nearExpiryCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-amber-800"><strong>{s.nearExpiryCount}</strong> items expiring within 90 days</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Stock Value by Category</CardTitle></CardHeader>
          <CardContent>
            {summaryQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {s?.categories?.map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                        <span className="font-medium truncate max-w-[140px]">{cat.category}</span>
                        <span className="text-muted-foreground text-xs">{cat.itemCount} items</span>
                      </div>
                      <span className="font-medium">{fmt(cat.stockValue)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(cat.stockValue / maxCat) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {s?.categories?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No inventory data</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Movement Types */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Stock Movements This Month</CardTitle></CardHeader>
          <CardContent>
            {consumptionQ.isLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-3">
                {c?.movementTypes?.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No movements recorded</p>
                ) : (
                  c?.movementTypes?.map((m, i) => {
                    const maxCount = Math.max(...(c.movementTypes.map(mt => mt.count)), 1)
                    const isOutward = m.type.includes('Out') || m.type === 'Issue' || m.type === 'Consumed' || m.type === 'Sale'
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{m.type}</span>
                          <span>{m.count} txns ({Math.round(m.quantity * 100) / 100} units)</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${isOutward ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${(m.count / maxCount) * 100}%` }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Consumed Items */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Top Consumed Items</CardTitle>
            <span className="text-xs text-muted-foreground">{c?.totalMovements ?? 0} total movements</span>
          </div>
        </CardHeader>
        <CardContent>
          {consumptionQ.isLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="max-h-72 overflow-y-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right w-24">Bar</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {c?.topConsumed?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="text-right font-medium">{Math.round(item.qty * 100) / 100} {item.unit}</TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${(item.qty / maxConsumed) * 100}%` }} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {c?.topConsumed?.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No consumption data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
