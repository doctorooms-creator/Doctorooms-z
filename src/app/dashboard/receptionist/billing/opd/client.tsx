'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Receipt, Plus, Search, Loader2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface OpdBill {
  id: string
  receiptNo: string
  patientName: string
  doctorName: string
  totalAmount: number
  paymentMethod: string
  paymentDate: string
  status: string
  createdAt: string
  consultationFee?: number
  labAmount?: number
  medicineAmount?: number
  otherAmount?: number
}

interface VisitedBooking {
  id: string
  patientName: string
  doctorName: string
  bookingDate: string
}

interface BillsResponse {
  bills: OpdBill[]
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

export default function ReceptionistOpdBillsClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState('')
  const [consultationFee, setConsultationFee] = useState('0')
  const [labAmount, setLabAmount] = useState('0')
  const [medicineAmount, setMedicineAmount] = useState('0')
  const [otherAmount, setOtherAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentRef, setPaymentRef] = useState('')

  // Fetch OPD bills (same API supports receptionist auth)
  const { data, isLoading } = useQuery<BillsResponse>({
    queryKey: ['receptionist-opd-bills', methodFilter, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (methodFilter !== 'All') params.set('paymentMethod', methodFilter)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/opd-bills?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load OPD bills')
      return res.json()
    },
  })

  // Fetch visited bookings for create dialog
  const { data: bookingsData } = useQuery<{ bookings: VisitedBooking[] }>({
    queryKey: ['receptionist-visited-bookings'],
    queryFn: async () => {
      const admRes = await fetch('/api/dashboard/receptionist/appointments?status=Visited&limit=100')
      if (!admRes.ok) throw new Error('Failed')
      const admData = await admRes.json()
      return { bookings: (admData.appointments || []).map((a: Record<string, unknown>) => ({
        id: a.id,
        patientName: a.patientName || '',
        doctorName: a.doctorName || '',
        bookingDate: a.bookingDate || a.date || '',
      })) }
    },
    enabled: showCreateDialog,
  })

  const visitedBookings = bookingsData?.bookings || []

  // Create bill mutation
  const createBillMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) throw new Error('Select a booking')
      const res = await fetch('/api/opd-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking,
          consultationFee: parseFloat(consultationFee) || 0,
          labAmount: parseFloat(labAmount) || 0,
          medicineAmount: parseFloat(medicineAmount) || 0,
          otherAmount: parseFloat(otherAmount) || 0,
          paymentMethod,
          paymentRef,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create bill')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('OPD bill created successfully')
      setShowCreateDialog(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['receptionist-opd-bills'] })
    },
    onError: (error) => { toast.error(error.message) },
  })

  function resetForm() {
    setSelectedBooking('')
    setConsultationFee('0')
    setLabAmount('0')
    setMedicineAmount('0')
    setOtherAmount('0')
    setPaymentMethod('Cash')
    setPaymentRef('')
  }

  const bills = data?.bills || []
  const pagination = data?.pagination
  const totalFee = (parseFloat(consultationFee) || 0) + (parseFloat(labAmount) || 0) +
    (parseFloat(medicineAmount) || 0) + (parseFloat(otherAmount) || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <Receipt className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">OPD Bills</h1>
            <p className="text-sm text-muted-foreground">Outpatient billing records</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4" />
              Create Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create OPD Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Visited Booking</label>
                <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                  <SelectTrigger><SelectValue placeholder="Choose booking..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {visitedBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.patientName} — Dr. {booking.doctorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Consultation Fee</label>
                  <Input type="number" min="0" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Lab Charges</label>
                  <Input type="number" min="0" value={labAmount} onChange={(e) => setLabAmount(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Medicine</label>
                  <Input type="number" min="0" value={medicineAmount} onChange={(e) => setMedicineAmount(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Other</label>
                  <Input type="number" min="0" value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} />
                </div>
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
                <label className="text-sm font-medium mb-1.5 block">Payment Reference (Optional)</label>
                <Input placeholder="UTR/Transaction ID..." value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{formatCurrency(totalFee)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700"
                disabled={!selectedBooking || totalFee <= 0 || createBillMutation.isPending}
                onClick={() => createBillMutation.mutate()}
              >
                {createBillMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['receptionist-opd-bills'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">Doctor</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Consultation</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Lab</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Medicine</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {bills.map((bill) => (
                      <motion.tr
                        key={bill.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">{bill.receiptNo}</TableCell>
                        <TableCell className="text-sm">
                          {bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                        </TableCell>
                        <TableCell className="font-medium">{bill.patientName || '—'}</TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{bill.doctorName || '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{formatCurrency(bill.consultationFee || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden lg:table-cell">{formatCurrency(bill.labAmount || 0)}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden lg:table-cell">{formatCurrency(bill.medicineAmount || 0)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(bill.totalAmount)}</TableCell>
                        <TableCell>{getMethodBadge(bill.paymentMethod)}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No OPD bills found</p>
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
