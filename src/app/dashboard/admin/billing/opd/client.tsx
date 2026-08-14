'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Receipt, Search, RefreshCw, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface OpdBill {
  id: string
  receiptNo: string
  patientName: string
  doctorName: string
  hospitalName: string
  consultationFee: number
  totalAmount: number
  paymentMethod: string
  paymentDate: string
  status: string
  createdAt: string
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
    case 'Cash':
      return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">Cash</Badge>
    case 'UPI':
      return <Badge variant="outline" className="border-violet-500 text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400">UPI</Badge>
    case 'Card':
      return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400">Card</Badge>
    case 'NetBanking':
      return <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400">NetBanking</Badge>
    case 'Cheque':
      return <Badge variant="outline" className="border-rose-500 text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400">Cheque</Badge>
    case 'Insurance':
      return <Badge variant="outline" className="border-slate-500 text-slate-700 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400">Insurance</Badge>
    default:
      return <Badge variant="outline">{method}</Badge>
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Paid':
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
    case 'Pending':
      return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400">Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ============ Component ============

export default function AdminOpdBillsClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<BillsResponse>({
    queryKey: ['admin-opd-bills', methodFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (methodFilter !== 'All') params.set('paymentMethod', methodFilter)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/admin/billing/opd-bills?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load OPD bills')
      return res.json()
    },
  })

  const bills = data?.bills || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
          <Receipt className="h-6 w-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">All OPD Bills</h1>
          <p className="text-sm text-muted-foreground">Outpatient billing across all hospitals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Payment Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Methods</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="NetBanking">Net Banking</SelectItem>
            <SelectItem value="Cheque">Cheque</SelectItem>
            <SelectItem value="Insurance">Insurance</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-opd-bills'] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">Doctor</TableHead>
                    <TableHead className="hidden lg:table-cell">Hospital</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Consultation</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Method</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <TableCell className="font-medium">{bill.patientName || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">Dr. {bill.doctorName || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{bill.hospitalName}</TableCell>
                        <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{formatCurrency(bill.consultationFee)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(bill.totalAmount)}</TableCell>
                        <TableCell className="hidden md:table-cell">{getMethodBadge(bill.paymentMethod)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(bill.paymentDate)}</TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/hospital/billing/opd/${bill.id}`}>
                            <Button variant="ghost" size="icon" title="View Bill">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
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
              {methodFilter !== 'All' && (
                <p className="text-sm mt-1">Try changing the payment method filter</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
