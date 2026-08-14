'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wallet, Plus, Search, Loader2, RefreshCw } from 'lucide-react'
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

interface AdmittedPatient {
  id: string
  admissionNo: string
  patientName: string
  wardName: string
  bedNumber: string
  doctorName: string
  admissionDate: string
}

interface Advance {
  id: string
  receiptNo: string
  amount: number
  paymentMethod: string
  paymentRef: string
  notes: string
  createdAt: string
  admissionId: string
  patientName?: string
  admissionNo?: string
  receivedByName?: string
}

interface AdvanceSummary {
  totalAdvance: number
  lastAdvanceDate: string | null
  lastAdvanceAmount: number
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

export default function ReceptionistAdvancesClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentRef, setPaymentRef] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch advances
  const { data, isLoading } = useQuery<{ advances: Advance[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>({
    queryKey: ['receptionist-advances', search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')
      const res = await fetch(`/api/patient-advances?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load advances')
      return res.json()
    },
  })

  // Fetch admitted patients
  const { data: admittedData } = useQuery<{ admissions: AdmittedPatient[] }>({
    queryKey: ['receptionist-admitted-for-advance'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-admissions?status=Admitted&limit=100')
      if (!res.ok) throw new Error('Failed')
      const d = await res.json()
      return { admissions: d.admissions || [] }
    },
    enabled: showAddDialog,
  })

  // Add advance mutation
  const addAdvanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAdmission || !amount) throw new Error('Select admission and enter amount')
      const res = await fetch('/api/patient-advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedAdmission,
          amount: parseFloat(amount),
          paymentMethod,
          paymentRef,
          notes,
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to record advance') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Advance deposit recorded successfully')
      setShowAddDialog(false)
      setSelectedAdmission(''); setAmount(''); setPaymentMethod('Cash'); setPaymentRef(''); setNotes('')
      queryClient.invalidateQueries({ queryKey: ['receptionist-advances'] })
    },
    onError: (error) => { toast.error(error.message) },
  })

  const advances = data?.advances || []
  const pagination = data?.pagination
  const totalAdvances = useMemo(() => advances.reduce((sum, a) => sum + a.amount, 0), [advances])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Advance Deposits</h1>
            <p className="text-sm text-muted-foreground">Patient advance deposits management</p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4" />
              Record Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Advance Deposit</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Admitted Patient</label>
                <Select value={selectedAdmission} onValueChange={setSelectedAdmission}>
                  <SelectTrigger><SelectValue placeholder="Choose admission..." /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(admittedData?.admissions || []).map((adm) => (
                      <SelectItem key={adm.id} value={adm.id}>
                        {adm.admissionNo} — {adm.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount</label>
                <Input type="number" min="1" placeholder="Enter advance amount..." value={amount} onChange={(e) => setAmount(e.target.value)} />
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button className="bg-amber-600 hover:bg-amber-700" disabled={!selectedAdmission || !amount || addAdvanceMutation.isPending} onClick={() => addAdvanceMutation.mutate()}>
                {addAdvanceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Advance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Advances (Page)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalAdvances)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Records Shown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{advances.length}</p>
          </CardContent>
        </Card>
        <Card className="hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Advances are adjusted against the final bill at discharge</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
        </div>
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['receptionist-advances'] })}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Advances Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : advances.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">Admission No</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Received By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {advances.map((adv) => (
                      <motion.tr
                        key={adv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">{adv.receiptNo}</TableCell>
                        <TableCell className="font-medium">{adv.patientName || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="font-mono text-xs">{adv.admissionNo}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(adv.amount)}</TableCell>
                        <TableCell>{getMethodBadge(adv.paymentMethod)}</TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">
                          {new Date(adv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{adv.receivedByName || '—'}</TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No advance deposits found</p>
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
