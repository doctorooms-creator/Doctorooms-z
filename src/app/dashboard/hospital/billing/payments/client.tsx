'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreditCard, Plus, Search, Loader2, RefreshCw, IndianRupee, Wallet, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface DailySummary {
  totalCash: number
  totalUPI: number
  totalCard: number
  totalNetBanking: number
  totalCheque: number
  grandTotal: number
  count: number
}

interface Payment {
  id: string
  receiptNo: string
  billNo: string
  patientName: string
  admissionNo: string
  amount: number
  paymentMethod: string
  paymentRef: string
  paymentDate: string
  notes: string
}

interface BillForPayment {
  id: string
  billNo: string
  patientName: string
  admissionNo: string
  netPayable: number
  status: string
}

interface PaymentsResponse {
  payments: Payment[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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

export default function PaymentsClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [payRef, setPayRef] = useState('')

  // Fetch daily summary
  const { data: summary, isLoading: loadingSummary } = useQuery<DailySummary>({
    queryKey: ['bill-payments-daily-summary'],
    queryFn: async () => {
      const res = await fetch('/api/bill-payments/daily-summary')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  // Fetch payments
  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ['bill-payments', methodFilter, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (methodFilter !== 'All') params.set('paymentMethod', methodFilter)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/bill-payments?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  // Fetch bills for payment dialog
  const { data: billsForPayment } = useQuery<{ bills: BillForPayment[] }>({
    queryKey: ['ipd-bills-payable'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-bills?status=Final&limit=50')
      if (!res.ok) throw new Error('Failed')
      const d = await res.json()
      // Also fetch PartiallyPaid
      const res2 = await fetch('/api/ipd-bills?status=PartiallyPaid&limit=50')
      const d2 = await res2.json()
      return {
        bills: [
          ...(d.bills || []).filter((b: BillForPayment) => b.netPayable > 0),
          ...(d2.bills || []).filter((b: BillForPayment) => b.netPayable > 0),
        ],
      }
    },
    enabled: showRecordDialog,
  })

  const payableBills = billsForPayment?.bills || []

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBill) throw new Error('Select a bill')
      if (!payAmount || parseFloat(payAmount) <= 0) throw new Error('Enter valid amount')

      const res = await fetch('/api/bill-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: selectedBill,
          amount: parseFloat(payAmount),
          paymentMethod: payMethod,
          paymentRef: payRef,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record payment')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully')
      setShowRecordDialog(false)
      setSelectedBill('')
      setPayAmount('')
      setPayMethod('Cash')
      setPayRef('')
      queryClient.invalidateQueries({ queryKey: ['bill-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bill-payments-daily-summary'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const payments = data?.payments || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Payments</h1>
            <p className="text-sm text-muted-foreground">Bill payment collection</p>
          </div>
        </div>
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Bill</label>
                <Select value={selectedBill} onValueChange={(v) => {
                  setSelectedBill(v)
                  const bill = payableBills.find((b) => b.id === v)
                  if (bill) setPayAmount(bill.netPayable.toString())
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose bill..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {payableBills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.billNo} — {bill.patientName} ({formatCurrency(bill.netPayable)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBill && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                  <Input
                    type="number"
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Net payable: {formatCurrency(payableBills.find((b) => b.id === selectedBill)?.netPayable || 0)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="NetBanking">Net Banking</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Reference (Optional)</label>
                <Input
                  placeholder="UTR/Transaction ID..."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecordDialog(false)}>Cancel</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!selectedBill || !payAmount || recordPaymentMutation.isPending}
                onClick={() => recordPaymentMutation.mutate()}
              >
                {recordPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-medium text-muted-foreground">Cash</p>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary?.totalCash || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-violet-200 dark:border-violet-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="h-4 w-4 text-violet-600" />
                  <p className="text-xs font-medium text-muted-foreground">UPI</p>
                </div>
                <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  {formatCurrency(summary?.totalUPI || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-medium text-muted-foreground">Card</p>
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {formatCurrency(summary?.totalCard || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-teal-200 dark:border-teal-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-medium text-muted-foreground">Total Today</p>
                </div>
                <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
                  {formatCurrency(summary?.grandTotal || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary?.count || 0} transactions</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1) }} className="w-auto" />
        <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1) }} className="w-auto" />
        <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Methods</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="NetBanking">Net Banking</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['bill-payments'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {payments.map((payment) => (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">{payment.receiptNo}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.billNo}</TableCell>
                        <TableCell className="font-medium">{payment.patientName || '—'}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          }) : '—'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
