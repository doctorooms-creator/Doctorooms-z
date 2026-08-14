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
  receivedByName: string
}

interface UnpaidBill {
  id: string
  billNo: string
  patientName: string
  admissionNo: string
  totalAmount: number
  netPayable: number
  status: string
}

interface PaymentsResponse {
  payments: Payment[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `\u20b9${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getMethodBadge(method: string) {
  switch (method) {
    case 'Cash': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Cash</Badge>
    case 'UPI': return <Badge variant="outline" className="border-violet-500 text-violet-700 bg-violet-50">UPI</Badge>
    case 'Card': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Card</Badge>
    case 'NetBanking': return <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50">Net Banking</Badge>
    case 'Cheque': return <Badge variant="outline" className="border-rose-500 text-rose-700 bg-rose-50">Cheque</Badge>
    default: return <Badge variant="outline">{method}</Badge>
  }
}

// ============ Component ============

export default function ReceptionistPaymentsClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [selectedBill, setSelectedBill] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentRef, setPaymentRef] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch daily summary
  const { data: summary } = useQuery<DailySummary>({
    queryKey: ['receptionist-daily-summary'],
    queryFn: async () => {
      const res = await fetch('/api/bill-payments/daily-summary')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  // Fetch payments
  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ['receptionist-payments', methodFilter, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (methodFilter !== 'All') params.set('paymentMethod', methodFilter)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/bill-payments?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load payments')
      return res.json()
    },
  })

  // Fetch unpaid bills for record dialog
  const { data: unpaidBillsData } = useQuery<{ bills: UnpaidBill[] }>({
    queryKey: ['receptionist-unpaid-bills'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-bills?status=Final')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const bills = (data.bills || []).filter((b: UnpaidBill) => b.status === 'Final' || b.status === 'PartiallyPaid')
      return { bills }
    },
    enabled: showRecordDialog,
  })

  // Record payment mutation
  const recordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBill || !amount) throw new Error('Select bill and enter amount')
      const res = await fetch('/api/bill-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: selectedBill,
          amount: parseFloat(amount),
          paymentMethod,
          paymentRef,
          notes,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to record payment') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully')
      setShowRecordDialog(false)
      setSelectedBill(''); setAmount(''); setPaymentMethod('Cash'); setPaymentRef(''); setNotes('')
      queryClient.invalidateQueries({ queryKey: ['receptionist-payments'] })
      queryClient.invalidateQueries({ queryKey: ['receptionist-daily-summary'] })
    },
    onError: (error) => { toast.error(error.message) },
  })

  const payments = data?.payments || []
  const pagination = data?.pagination

  const summaryCards = [
    { label: 'Cash', value: summary?.totalCash || 0, icon: IndianRupee, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { label: 'UPI', value: summary?.totalUPI || 0, icon: Smartphone, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
    { label: 'Card', value: summary?.totalCard || 0, icon: CreditCard, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
    { label: 'Total', value: summary?.grandTotal || 0, icon: Wallet, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <CreditCard className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Payments</h1>
            <p className="text-sm text-muted-foreground">Bill payment collection</p>
          </div>
        </div>
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Bill</label>
                <Select value={selectedBill} onValueChange={setSelectedBill}>
                  <SelectTrigger><SelectValue placeholder="Choose unpaid bill..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(unpaidBillsData?.bills || []).map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.billNo} — {bill.patientName} ({formatCurrency(bill.netPayable)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount</label>
                <Input type="number" min="1" placeholder="Enter amount..." value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <label className="text-sm font-medium mb-1.5 block">Reference (Optional)</label>
                <Input placeholder="UTR/Transaction ID..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notes (Optional)</label>
                <Input placeholder="Any notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRecordDialog(false)}>Cancel</Button>
              <Button className="bg-violet-600 hover:bg-violet-700" disabled={!selectedBill || !amount || recordMutation.isPending} onClick={() => recordMutation.mutate()}>
                {recordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s {card.label}</CardTitle>
              <div className={`p-1.5 rounded-md ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
              <p className="text-xs text-muted-foreground">{summary?.count || 0} transactions</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['receptionist-payments'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Received By</TableHead>
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
                        <TableCell className="font-medium">{payment.patientName}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{payment.receivedByName}</TableCell>
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
