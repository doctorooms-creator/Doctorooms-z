'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Search, RefreshCw, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface IpdBill {
  id: string
  billNo: string
  patientName: string
  admissionNo: string
  totalAmount: number
  netPayable: number
  status: string
  generatedAt: string | null
  finalizedAt: string | null
  hospitalName: string
}

interface BillsResponse {
  bills: IpdBill[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `\u20b9${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Draft':
      return <Badge variant="outline" className="border-slate-400 text-slate-600 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400">Draft</Badge>
    case 'Final':
      return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400">Final</Badge>
    case 'Paid':
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Paid</Badge>
    case 'PartiallyPaid':
      return <Badge variant="outline" className="border-teal-500 text-teal-700 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400">Partially Paid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ============ Component ============

export default function AdminIpdBillsClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<BillsResponse>({
    queryKey: ['admin-ipd-bills', activeTab, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab !== 'All') params.set('status', activeTab)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/admin/billing/ipd-bills?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load IPD bills')
      return res.json()
    },
  })

  const bills = data?.bills || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">All IPD Bills</h1>
          <p className="text-sm text-muted-foreground">Inpatient billing across all hospitals</p>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1) }}>
        <TabsList className="grid grid-cols-5 w-full max-w-lg">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Draft">Draft</TabsTrigger>
          <TabsTrigger value="Final">Final</TabsTrigger>
          <TabsTrigger value="Paid">Paid</TabsTrigger>
          <TabsTrigger value="PartiallyPaid">Partial</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + Refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-ipd-bills'] })}
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
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">Admission No</TableHead>
                    <TableHead className="hidden lg:table-cell">Hospital Name</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Generated At</TableHead>
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
                        <TableCell className="font-mono text-sm">{bill.billNo}</TableCell>
                        <TableCell className="font-medium">{bill.patientName}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="font-mono text-xs">{bill.admissionNo}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{bill.hospitalName}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(bill.netPayable)}</TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(bill.generatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/hospital/billing/ipd/${bill.id}`}>
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
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No IPD bills found</p>
              {activeTab !== 'All' && (
                <p className="text-sm mt-1">Try changing the status filter</p>
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
