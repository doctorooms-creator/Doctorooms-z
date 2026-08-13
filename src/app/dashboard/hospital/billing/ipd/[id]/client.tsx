'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, FileText, CheckCircle, Trash2, Plus, Loader2, BedDouble, User, Stethoscope, Wallet,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface LineItem {
  id: string
  billId: string
  chargeItemId: string | null
  categoryId: string
  itemName: string
  description: string
  quantity: number
  unitType: string
  rate: number
  amount: number
  taxPercent: number
  taxAmount: number
  totalAmount: number
  chargeItem?: { name: string; category?: { name: string } }
}

interface Payment {
  id: string
  receiptNo: string
  amount: number
  paymentMethod: string
  paymentRef: string
  paymentDate: string
  receivedBy: string
  notes: string
}

interface BillDetail {
  id: string
  billNo: string
  admissionId: string
  hospitalId: string
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
  generatedAt: string | null
  finalizedAt: string | null
  lineItems: LineItem[]
  payments: Payment[]
  advances: { id: string; receiptNo: string; amount: number; paymentMethod: string; createdAt: string }[]
  admission: {
    patientName: string
    admissionNo: string
    wardName: string
    bedNumber: string
    doctorName: string
  }
}

interface ChargeItem {
  id: string
  name: string
  shortCode: string
  rate: number
  unitType: string
  isTaxable: boolean
  taxPercent: number
  categoryId: string
  categoryName: string
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft': return <Badge variant="outline" className="border-slate-400 text-slate-600 bg-slate-50">Draft</Badge>
    case 'Final': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Final</Badge>
    case 'Paid': return <Badge className="bg-emerald-600 text-white">Paid</Badge>
    case 'PartiallyPaid': return <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50">Partially Paid</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function getMethodBadge(method: string) {
  switch (method) {
    case 'Cash': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Cash</Badge>
    case 'UPI': return <Badge variant="outline" className="border-violet-500 text-violet-700 bg-violet-50">UPI</Badge>
    case 'Card': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Card</Badge>
    case 'NetBanking': return <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50">NetBanking</Badge>
    case 'Cheque': return <Badge variant="outline" className="border-rose-500 text-rose-700 bg-rose-50">Cheque</Badge>
    default: return <Badge variant="outline">{method}</Badge>
  }
}

// ============ Component ============

export default function BillDetailClient() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const billId = params.id as string

  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [selectedChargeItem, setSelectedChargeItem] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [searchItems, setSearchItems] = useState('')

  // Fetch bill detail
  const { data, isLoading } = useQuery<{ bill: BillDetail }>({
    queryKey: ['ipd-bill', billId],
    queryFn: async () => {
      const res = await fetch(`/api/ipd-bills/${billId}`)
      if (!res.ok) throw new Error('Failed to load bill')
      return res.json()
    },
    enabled: !!billId,
  })

  // Fetch charge items for add dialog
  const { data: chargeItemsData } = useQuery<{ items: ChargeItem[] }>({
    queryKey: ['charge-items', searchItems],
    queryFn: async () => {
      const params = new URLSearchParams({ status: 'Active' })
      if (searchItems) params.set('search', searchItems)
      const res = await fetch(`/api/charge-items?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load charge items')
      return res.json()
    },
    enabled: showAddItemDialog,
  })

  const bill = data?.bill
  const isDraft = bill?.status === 'Draft'
  const chargeItems = chargeItemsData?.items || []

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChargeItem) throw new Error('Select a charge item')
      const item = chargeItems.find((c) => c.id === selectedChargeItem)
      if (!item) throw new Error('Item not found')

      const res = await fetch(`/api/ipd-bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addItems: [{
            chargeItemId: item.id,
            categoryId: item.categoryId,
            itemName: item.name,
            quantity: parseFloat(itemQuantity) || 1,
            rate: item.rate,
            unitType: item.unitType,
            isTaxable: item.isTaxable,
            taxPercent: item.taxPercent,
          }],
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add item')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Item added successfully')
      setShowAddItemDialog(false)
      setSelectedChargeItem('')
      setItemQuantity('1')
      queryClient.invalidateQueries({ queryKey: ['ipd-bill', billId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (lineItemId: string) => {
      const res = await fetch(`/api/ipd-bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeItemIds: [lineItemId] }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove item')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Item removed')
      queryClient.invalidateQueries({ queryKey: ['ipd-bill', billId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ipd-bills/${billId}/finalize`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to finalize')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Bill finalized successfully')
      setShowFinalizeDialog(false)
      queryClient.invalidateQueries({ queryKey: ['ipd-bill', billId] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetAddDialog = useCallback(() => {
    setSelectedChargeItem('')
    setItemQuantity('1')
    setSearchItems('')
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="text-center py-12">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-muted-foreground">Bill not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{bill.billNo}</h1>
              {getStatusBadge(bill.status)}
            </div>
            <p className="text-sm text-muted-foreground">IPD Bill Detail</p>
          </div>
        </div>
        {isDraft && (
          <div className="flex gap-2">
            <Dialog open={showAddItemDialog} onOpenChange={(open) => { setShowAddItemDialog(open); if (open) resetAddDialog() }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Line Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Search Charge Item</label>
                    <Input
                      placeholder="Search by name..."
                      value={searchItems}
                      onChange={(e) => setSearchItems(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Select Item</label>
                    <Select value={selectedChargeItem} onValueChange={setSelectedChargeItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose item..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {chargeItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} — {formatCurrency(item.rate)} / {item.unitType}
                            {item.categoryName && <span className="text-muted-foreground ml-1">({item.categoryName})</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedChargeItem && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>Cancel</Button>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!selectedChargeItem || addItemMutation.isPending}
                    onClick={() => addItemMutation.mutate()}
                  >
                    {addItemMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Item
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  Finalize Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Finalize Bill</DialogTitle>
                </DialogHeader>
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                  <AlertDescription>
                    This will lock the bill for editing and set it to &quot;Final&quot; status. Make sure all charges are added before finalizing.
                  </AlertDescription>
                </Alert>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>Cancel</Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={finalizeMutation.isPending}
                    onClick={() => finalizeMutation.mutate()}
                  >
                    {finalizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Finalize
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-medium text-sm">{bill.admission.patientName}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Admission No</p>
              <p className="font-medium text-sm font-mono">{bill.admission.admissionNo}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <BedDouble className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ward / Bed</p>
              <p className="font-medium text-sm">{bill.admission.wardName} - {bill.admission.bedNumber}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Stethoscope className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Doctor</p>
              <p className="font-medium text-sm">{bill.admission.doctorName}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {bill.lineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    {isDraft && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.lineItems.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.chargeItem?.category?.name || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.rate)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(item.taxAmount)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(item.totalAmount)}</TableCell>
                      {isDraft && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No line items added</p>
              {isDraft && (
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setShowAddItemDialog(true)}>
                  <Plus className="h-4 w-4" /> Add First Item
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Room Rent</span>
                <span className="font-mono">{formatCurrency(bill.roomRentAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">{formatCurrency(bill.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-mono text-rose-500">-{formatCurrency(bill.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-3">
                <span>Total Amount</span>
                <span className="font-mono">{formatCurrency(bill.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance Adjusted</span>
                <span className="font-mono text-emerald-600">-{formatCurrency(bill.advanceAdjusted)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Net Payable</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">{formatCurrency(bill.netPayable)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bill.payments.length > 0 ? (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.receiptNo}</TableCell>
                        <TableCell className="font-mono font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No payments recorded</p>
              </div>
            )}
            {bill.advances.length > 0 && (
              <div className="px-4 pb-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">Advance Deposits ({bill.advances.length})</p>
                {bill.advances.map((adv) => (
                  <div key={adv.id} className="flex justify-between text-sm py-1">
                    <span className="font-mono text-xs">{adv.receiptNo}</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(adv.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
