'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ShoppingCart,
  Clock,
  Package,
  ArrowRightLeft,
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

// ============ Types ============

interface LowStockItem {
  id: string
  name: string
  category: string
  genericName: string
  batchNo: string
  unit: string
  currentStock: number
  minStockLevel: number
  reorderQty: number
  storeLocation: string
  status: string
  stockPercent: number
  severity: 'Critical' | 'Warning' | 'Low'
}

interface ExpiringItem {
  id: string
  name: string
  batchNo: string
  unit: string
  currentStock: number
  expiryDate: string
  daysLeft: number
  isExpired: boolean
  category: string
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-600 hover:bg-red-700 text-white',
  Warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  Low: 'bg-orange-500 hover:bg-orange-600 text-white',
}

// ============ Component ============

export default function LowStockClient() {
  // Low stock items
  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/low-stock')
      if (!res.ok) throw new Error('Failed to load low stock items')
      return res.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Expiring items
  const { data: expiringData, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiring-soon'],
    queryFn: async () => {
      const res = await fetch('/api/inventory/expiring-soon')
      if (!res.ok) throw new Error('Failed to load expiring items')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const lowStockItems = (lowStockData?.items || []) as LowStockItem[]
  const expiringItems = (expiringData?.items || []) as ExpiringItem[]

  const criticalCount = lowStockItems.filter((i) => i.severity === 'Critical').length
  const warningCount = lowStockItems.filter((i) => i.severity === 'Warning').length
  const expiredCount = expiringItems.filter((i) => i.isExpired).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts</h1>
        <p className="text-muted-foreground">
          Monitor items with low stock levels and approaching expiry dates
        </p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {lowStockLoading ? <Skeleton className="h-7 w-10" /> : criticalCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Warning</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {lowStockLoading ? <Skeleton className="h-7 w-10" /> : warningCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/50">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {expiringLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    expiringItems.length
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Already Expired</p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                  {expiringLoading ? <Skeleton className="h-7 w-10" /> : expiredCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Items
            </CardTitle>
            <CardDescription>
              Items where current stock is at or below minimum stock level
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/hospital/inventory/items">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Manage Items
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {lowStockLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="mb-4 h-10 w-10 text-emerald-500/40" />
              <h3 className="text-lg font-medium text-emerald-700">All stock levels are healthy</h3>
              <p className="text-sm text-muted-foreground">
                No items are currently below their minimum stock level.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Min Stock</TableHead>
                    <TableHead className="hidden sm:table-cell">Stock Level</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Reorder Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {lowStockItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          item.severity === 'Critical' ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.batchNo && (
                            <div className="text-xs text-muted-foreground">{item.batchNo}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{item.category || '—'}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {item.currentStock}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-muted-foreground">
                          {item.minStockLevel}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Math.min(100, item.stockPercent)}
                              className="h-2 w-16"
                            />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(item.stockPercent)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right">
                          {item.reorderQty}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${SEVERITY_COLORS[item.severity]}`}>
                            {item.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link href="/dashboard/hospital/inventory/purchase-orders">
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Create PO
                            </Link>
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiring Soon Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Expiring Soon
            </CardTitle>
            <CardDescription>
              Items expiring within the next 30 days
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/hospital/inventory/stock">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Stock Movements
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {expiringLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : expiringItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-10 w-10 text-emerald-500/40" />
              <h3 className="text-lg font-medium text-emerald-700">No items expiring soon</h3>
              <p className="text-sm text-muted-foreground">
                All items have expiry dates beyond 30 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden md:table-cell">Batch</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {expiringItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          item.isExpired ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          {item.category && (
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {item.batchNo || '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.expiryDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              item.isExpired
                                ? 'text-rose-600'
                                : item.daysLeft <= 7
                                ? 'text-red-600'
                                : item.daysLeft <= 15
                                ? 'text-amber-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {item.isExpired ? 'Expired' : `${item.daysLeft}d`}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right font-medium">
                          {item.currentStock}
                        </TableCell>
                        <TableCell>
                          {item.isExpired ? (
                            <Badge className="bg-rose-600 hover:bg-rose-700">Expired</Badge>
                          ) : item.daysLeft <= 7 ? (
                            <Badge className="bg-red-600 hover:bg-red-700">Urgent</Badge>
                          ) : item.daysLeft <= 15 ? (
                            <Badge className="bg-amber-600 hover:bg-amber-700">Soon</Badge>
                          ) : (
                            <Badge className="bg-orange-500 hover:bg-orange-600">Caution</Badge>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
