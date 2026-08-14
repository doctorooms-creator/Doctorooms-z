'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileText, Plus, Eye, CheckCircle, Search, Loader2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
}

interface AdmittedPatient {
  id: string
  admissionNo: string
  patientName: string
  wardName: string
  bedNumber: string
  doctorName: string
  admissionDate: string
}

interface BillsResponse {
  bills: IpdBill[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
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

// ============ Component ============

export default function IpdBillsClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState('')

  // Fetch bills
  const { data, isLoading } = useQuery<BillsResponse>({
    queryKey: ['ipd-bills', activeTab, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab !== 'All') params.set('status', activeTab)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/ipd-bills?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load IPD bills')
      return res.json()
    },
  })

  // Fetch admitted patients for generate dialog
  const { data: admittedPatients, isLoading: loadingAdmissions } = useQuery<AdmittedPatient[]>({
    queryKey: ['ipd-admissions-admitted'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-bills?status=Admitted&_forGenerate=1')
      // Use a separate approach - fetch from the IPD admissions API
      const admRes = await fetch('/api/ipd-admissions?status=Admitted&limit=100')
      if (!admRes.ok) throw new Error('Failed to load admitted patients')
      const admData = await admRes.json()
      return admData.admissions || []
    },
    enabled: showGenerateDialog,
  })

  // Generate bill mutation
  const generateMutation = useMutation({
    mutationFn: async (admissionId: string) => {
      const res = await fetch('/api/ipd-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to generate bill')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Draft bill generated successfully')
      setShowGenerateDialog(false)
      setSelectedAdmission('')
      queryClient.invalidateQueries({ queryKey: ['ipd-bills'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Finalize bill mutation
  const finalizeMutation = useMutation({
    mutationFn: async (billId: string) => {
      const res = await fetch(`/api/ipd-bills/${billId}/finalize`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to finalize bill')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Bill finalized successfully')
      queryClient.invalidateQueries({ queryKey: ['ipd-bills'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const bills = data?.bills || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">IPD Bills</h1>
            <p className="text-sm text-muted-foreground">Manage inpatient billing</p>
          </div>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4" />
              Generate Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate IPD Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Admitted Patient</label>
                {loadingAdmissions ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedAdmission} onValueChange={setSelectedAdmission}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose admission..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(admittedPatients || []).map((adm) => (
                        <SelectItem key={adm.id} value={adm.id}>
                          {adm.admissionNo} — {adm.patientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!selectedAdmission || generateMutation.isPending}
                onClick={() => generateMutation.mutate(selectedAdmission)}
              >
                {generateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Draft Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Search */}
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
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ipd-bills'] })}
        >
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
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Advance Adj.</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
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
                        <TableCell className="font-mono text-sm">{bill.billNo}</TableCell>
                        <TableCell className="font-medium">{bill.patientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{bill.admissionNo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(bill.totalAmount)}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(bill.totalAmount - bill.netPayable)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(bill.netPayable)}</TableCell>
                        <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/hospital/billing/ipd/${bill.id}`}>
                              <Button variant="ghost" size="icon" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {bill.status === 'Draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Finalize"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => finalizeMutation.mutate(bill.id)}
                                disabled={finalizeMutation.isPending}
                              >
                                {finalizeMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
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
              {activeTab !== 'All' && <p className="text-sm mt-1">Try changing the status filter</p>}
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
