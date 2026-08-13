'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart,
  Plus,
  Trash2,
  PackageCheck,
  Eye,
  X,
  Loader2,
  Search,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierName: string
  supplierContact: string
  supplierAddress: string
  expectedDate: string | null
  totalAmount: number
  status: string
  notes: string
  itemsCount: number
  createdAt: string
  updatedAt: string
}

interface PurchaseOrderItem {
  id: string
  inventoryItemId: string
  quantity: number
  unitPrice: number
  total: number
  receivedQty: number
  item: { name: string; batchNo: string; unit: string }
}

interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderItem[]
  fullyReceived: boolean
}

interface InventoryItem {
  id: string
  name: string
  batchNo: string
  unit: string
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-600 hover:bg-gray-700',
  Pending: 'bg-amber-600 hover:bg-amber-700',
  Approved: 'bg-sky-600 hover:bg-sky-700',
  'Partially Received': 'bg-orange-600 hover:bg-orange-700',
  Received: 'bg-emerald-600 hover:bg-emerald-700',
  Cancelled: 'bg-red-600 hover:bg-red-700',
}

interface POItemRow {
  inventoryItemId: string
  quantity: number
  unitPrice: number
}

const emptyPOItems: POItemRow[] = [{ inventoryItemId: '', quantity: 1, unitPrice: 0 }]

// ============ Component ============

export default function PurchaseOrdersClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Create PO form
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [poNotes, setPoNotes] = useState('')
  const [poItems, setPoItems] = useState<POItemRow[]>(emptyPOItems)

  // View/Receive state
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrderDetail | null>(null)
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrderDetail | null>(null)
  const [cancellingOrder, setCancellingOrder] = useState<PurchaseOrder | null>(null)
  const [receivedItems, setReceivedItems] = useState<Record<string, number>>({})

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/purchase-orders?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load purchase orders')
      return res.json()
    },
  })

  // Fetch inventory items for dropdown
  const { data: itemsData } = useQuery({
    queryKey: ['inventory-items-active'],
    queryFn: async () => {
      const res = await fetch('/api/inventory-items?status=Active')
      if (!res.ok) throw new Error('Failed to load items')
      return res.json()
    },
  })

  // Create PO mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const validItems = poItems.filter((i) => i.inventoryItemId && i.quantity > 0)
      if (validItems.length === 0) throw new Error('Add at least one valid item')

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName,
          supplierContact,
          supplierAddress,
          expectedDate: expectedDate || null,
          notes: poNotes,
          items: validItems,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create purchase order')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Purchase order created successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      closeCreateDialog()
    },
    onError: (err) => toast.error(err.message),
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to cancel PO')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Purchase order cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      setCancelDialogOpen(false)
      setCancellingOrder(null)
    },
    onError: (err) => toast.error(err.message),
  })

  // Receive mutation
  const receiveMutation = useMutation({
    mutationFn: async ({ id, items }: { id: string; items: { poItemId: string; receivedQty: number }[] }) => {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to receive items')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Items received successfully')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      closeReceiveDialog()
    },
    onError: (err) => toast.error(err.message),
  })

  // Handlers
  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setSupplierName('')
    setSupplierContact('')
    setSupplierAddress('')
    setExpectedDate('')
    setPoNotes('')
    setPoItems(emptyPOItems)
  }

  const closeViewDialog = () => {
    setViewDialogOpen(false)
    setViewingOrder(null)
  }

  const closeReceiveDialog = () => {
    setReceiveDialogOpen(false)
    setReceivingOrder(null)
    setReceivedItems({})
  }

  const addPOItemRow = () => {
    setPoItems([...poItems, { inventoryItemId: '', quantity: 1, unitPrice: 0 }])
  }

  const removePOItemRow = (index: number) => {
    if (poItems.length <= 1) return
    setPoItems(poItems.filter((_, i) => i !== index))
  }

  const updatePOItem = (index: number, field: keyof POItemRow, value: string | number) => {
    const updated = [...poItems]
    updated[index] = { ...updated[index], [field]: value }
    setPoItems(updated)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  const handleViewOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`)
      if (!res.ok) throw new Error('Failed to load order')
      const data = await res.json()
      setViewingOrder(data.order)
      setViewDialogOpen(true)
    } catch {
      toast.error('Failed to load purchase order details')
    }
  }

  const handleOpenReceive = async (orderId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${orderId}`)
      if (!res.ok) throw new Error('Failed to load order')
      const data = await res.json()
      setReceivingOrder(data.order)
      const initial: Record<string, number> = {}
      data.order.items.forEach((item: PurchaseOrderItem) => {
        initial[item.id] = Math.max(0, item.quantity - item.receivedQty)
      })
      setReceivedItems(initial)
      setReceiveDialogOpen(true)
    } catch {
      toast.error('Failed to load purchase order for receiving')
    }
  }

  const handleReceiveSubmit = () => {
    if (!receivingOrder) return
    const items = receivingOrder.items
      .filter((item) => (receivedItems[item.id] || 0) > 0)
      .map((item) => ({
        poItemId: item.id,
        receivedQty: receivedItems[item.id] || 0,
      }))
    if (items.length === 0) {
      toast.error('Enter quantities for at least one item')
      return
    }
    receiveMutation.mutate({ id: receivingOrder.id, items })
  }

  const handleCancel = () => {
    if (cancellingOrder) {
      cancelMutation.mutate(cancellingOrder.id)
    }
  }

  const totalPOAmount = useMemo(
    () => poItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [poItems]
  )

  const orders = (ordersData?.orders || []) as PurchaseOrder[]
  const allItems = (itemsData?.items || []) as InventoryItem[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders for inventory replenishment</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Create PO
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by PO number or supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(STATUS_COLORS).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
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
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No purchase orders found</h3>
              <p className="text-sm text-muted-foreground">
                Create your first purchase order to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO No</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Expected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {orders
                      .filter(
                        (o) =>
                          !search ||
                          o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
                          o.supplierName.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15, delay: index * 0.02 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="font-mono font-medium">{order.poNumber}</TableCell>
                          <TableCell>
                            <div className="font-medium">{order.supplierName || '—'}</div>
                            {order.supplierContact && (
                              <div className="text-xs text-muted-foreground">
                                {order.supplierContact}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-center">
                            {order.itemsCount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${STATUS_COLORS[order.status] || 'bg-gray-600'}`}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {order.expectedDate
                              ? new Date(order.expectedDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewOrder(order.id)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!['Received', 'Cancelled'].includes(order.status) && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenReceive(order.id)}
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                  >
                                    <PackageCheck className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setCancellingOrder(order)
                                      setCancelDialogOpen(true)
                                    }}
                                    className="h-8 w-8 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
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

      {/* Create PO Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Add supplier details and item lines for the purchase order.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. MedPharm Distributors"
                />
              </div>
              <div>
                <Label htmlFor="supplierContact">Contact</Label>
                <Input
                  id="supplierContact"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  placeholder="Phone or email"
                />
              </div>
              <div>
                <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="supplierAddress">Address</Label>
                <Input
                  id="supplierAddress"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  placeholder="Supplier address"
                />
              </div>
            </div>

            {/* Item Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPOItemRow}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                {poItems.map((row, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select
                        value={row.inventoryItemId}
                        onValueChange={(v) => updatePOItem(index, 'inventoryItemId', v)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} {item.batchNo ? `(${item.batchNo})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={row.quantity || ''}
                        onChange={(e) =>
                          updatePOItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                        placeholder="Qty"
                        className="text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unitPrice || ''}
                        onChange={(e) =>
                          updatePOItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        placeholder="Price"
                        className="text-sm"
                      />
                    </div>
                    <div className="w-20 text-right text-sm font-medium">
                      ₹{(row.quantity * row.unitPrice).toLocaleString('en-IN')}
                    </div>
                    {poItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePOItemRow(index)}
                        className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right text-sm">
                Total: <span className="font-bold">₹{totalPOAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="poNotes">Notes</Label>
              <Textarea
                id="poNotes"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreateDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create PO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => !open && closeViewDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Purchase Order {viewingOrder?.poNumber}
            </DialogTitle>
            <DialogDescription>Order details and line items</DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Supplier:</span>{' '}
                  <span className="font-medium">{viewingOrder.supplierName || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span>{' '}
                  <span className="font-medium">{viewingOrder.supplierContact || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected:</span>{' '}
                  <span className="font-medium">
                    {viewingOrder.expectedDate
                      ? new Date(viewingOrder.expectedDate).toLocaleDateString('en-IN')
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <Badge
                    className={`${STATUS_COLORS[viewingOrder.status] || 'bg-gray-600'}`}
                  >
                    {viewingOrder.status}
                  </Badge>
                </div>
                {viewingOrder.notes && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Notes:</span>{' '}
                    <span className="font-medium">{viewingOrder.notes}</span>
                  </div>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.item.name}</div>
                        {item.item.batchNo && (
                          <div className="text-xs text-muted-foreground">{item.item.batchNo}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{item.unitPrice.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.total.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            item.receivedQty >= item.quantity
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : item.receivedQty > 0
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-gray-600 hover:bg-gray-700'
                          }
                        >
                          {item.receivedQty}/{item.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right text-sm font-semibold">
                Grand Total: ₹{viewingOrder.totalAmount.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive PO Dialog */}
      <Dialog
        open={receiveDialogOpen}
        onOpenChange={(open) => !open && closeReceiveDialog()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Receive PO {receivingOrder?.poNumber}
            </DialogTitle>
            <DialogDescription>
              Enter quantities received for each item.
            </DialogDescription>
          </DialogHeader>
          {receivingOrder && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Already</TableHead>
                    <TableHead className="text-right">Receiving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivingOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.receivedQty}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity - item.receivedQty}
                          value={receivedItems[item.id] ?? 0}
                          onChange={(e) =>
                            setReceivedItems({
                              ...receivedItems,
                              [item.id]: Math.min(
                                parseFloat(e.target.value) || 0,
                                item.quantity - item.receivedQty
                              ),
                            })
                          }
                          className="w-24 text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DialogFooter>
                <Button variant="outline" onClick={closeReceiveDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReceiveSubmit}
                  disabled={receiveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {receiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel PO &ldquo;{cancellingOrder?.poNumber}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep PO</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel PO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
