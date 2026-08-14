'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRightLeft,
  Plus,
  Search,
  Package,
  IndianRupee,
  AlertTriangle,
  TrendingDown,
  Loader2,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ Types ============

interface StockMovement {
  id: string
  itemId: string
  itemName: string
  itemBatchNo: string
  itemUnit: string
  movementType: string
  quantity: number
  referenceNo: string
  fromLocation: string
  toLocation: string
  notes: string
  movedBy: string
  movedByName: string
  createdAt: string
}

interface InventoryItem {
  id: string
  name: string
  batchNo: string
  unit: string
  currentStock: number
}

interface Summary {
  totalItems: number
  totalValue: number
  lowStockCount: number
  expiredCount: number
}

const MOVEMENT_TYPES = [
  'Purchase',
  'Sale',
  'Issue',
  'Return',
  'Transfer',
  'Adjustment',
  'Expired',
  'Damaged',
]

const TYPE_COLORS: Record<string, string> = {
  Purchase: 'bg-emerald-600 hover:bg-emerald-700',
  Return: 'bg-teal-600 hover:bg-teal-700',
  Sale: 'bg-orange-600 hover:bg-orange-700',
  Issue: 'bg-amber-600 hover:bg-amber-700',
  Transfer: 'bg-sky-600 hover:bg-sky-700',
  Adjustment: 'bg-violet-600 hover:bg-violet-700',
  Expired: 'bg-red-600 hover:bg-red-700',
  Damaged: 'bg-rose-600 hover:bg-rose-700',
}

const emptyForm = {
  itemId: '',
  movementType: 'Purchase',
  quantity: 0,
  referenceNo: '',
  fromLocation: '',
  toLocation: '',
  notes: '',
}

// ============ Component ============

export default function StockMovementsClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [itemFilter, setItemFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const res = await fetch('/api/stock-movements/summary')
      if (!res.ok) throw new Error('Failed to load summary')
      return res.json()
    },
  })

  // Movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', itemFilter, typeFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (itemFilter && itemFilter !== 'all') params.set('itemId', itemFilter)
      if (typeFilter && typeFilter !== 'all') params.set('movementType', typeFilter)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      const res = await fetch(`/api/stock-movements?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load movements')
      return res.json()
    },
  })

  // Inventory items for dropdown
  const { data: itemsData } = useQuery({
    queryKey: ['inventory-items-all'],
    queryFn: async () => {
      const res = await fetch('/api/inventory-items?status=Active')
      if (!res.ok) throw new Error('Failed to load items')
      return res.json()
    },
  })

  // Create movement mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record movement')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Stock movement recorded successfully')
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      closeDialog()
    },
    onError: (err) => toast.error(err.message),
  })

  const openDialog = () => {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setForm(emptyForm)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.itemId || form.quantity <= 0) {
      toast.error('Please select an item and enter a valid quantity')
      return
    }
    createMutation.mutate(form)
  }

  const summaryData = summary as Summary | undefined
  const movements = (movementsData?.movements || []) as StockMovement[]
  const allItems = (itemsData?.items || []) as InventoryItem[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">Track inventory stock movements and history</p>
        </div>
        <Button onClick={openDialog} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">
                  {summaryLoading ? <Skeleton className="h-7 w-16" /> : summaryData?.totalItems ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {summaryLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    `₹${((summaryData?.totalValue ?? 0) / 1000).toFixed(1)}K`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">
                  {summaryLoading ? <Skeleton className="h-7 w-12" /> : summaryData?.lowStockCount ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {summaryLoading ? <Skeleton className="h-7 w-12" /> : summaryData?.expiredCount ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Select value={itemFilter} onValueChange={setItemFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                {allItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} {item.batchNo ? `(${item.batchNo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Movement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {MOVEMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm">From:</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="shrink-0 text-sm">To:</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          {movementsLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowRightLeft className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No stock movements found</h3>
              <p className="text-sm text-muted-foreground">
                Record your first stock movement to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="hidden md:table-cell">Reference</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden xl:table-cell">Notes</TableHead>
                    <TableHead className="hidden md:table-cell">By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {movements.map((movement, index) => (
                      <motion.tr
                        key={movement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, delay: index * 0.02 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="text-sm">
                          {new Date(movement.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{movement.itemName}</div>
                          {movement.itemBatchNo && (
                            <div className="text-xs text-muted-foreground">
                              {movement.itemBatchNo}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${TYPE_COLORS[movement.movementType] || 'bg-gray-600'}`}
                          >
                            {movement.movementType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              ['Purchase', 'Return'].includes(movement.movementType)
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }
                          >
                            {['Purchase', 'Return'].includes(movement.movementType) ? '+' : '-'}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {movement.referenceNo || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {movement.fromLocation && movement.toLocation ? (
                            `${movement.fromLocation} → ${movement.toLocation}`
                          ) : (
                            movement.fromLocation || movement.toLocation || '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-muted-foreground max-w-48 truncate">
                          {movement.notes || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {movement.movedByName}
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

      {/* Add Movement Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
            <DialogDescription>
              Record a new stock movement (purchase, sale, issue, return, etc.)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="itemId">Inventory Item *</Label>
              <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item..." />
                </SelectTrigger>
                <SelectContent>
                  {allItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="movementType">Movement Type *</Label>
                <Select
                  value={form.movementType}
                  onValueChange={(v) => setForm({ ...form, movementType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.quantity || ''}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="referenceNo">Reference No</Label>
                <Input
                  id="referenceNo"
                  value={form.referenceNo}
                  onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                  placeholder="e.g. PO-001, INV-002"
                />
              </div>
              <div>
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  value={form.fromLocation}
                  onChange={(e) => setForm({ ...form, fromLocation: e.target.value })}
                  placeholder="e.g. Warehouse A"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  value={form.toLocation}
                  onChange={(e) => setForm({ ...form, toLocation: e.target.value })}
                  placeholder="e.g. Pharmacy Shelf"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Movement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
