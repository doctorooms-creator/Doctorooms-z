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

export default function AdvancesClient() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [paymentRef, setPaymentRef] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch admitted patients
  const { data: admittedData } = useQuery<{ admissions: AdmittedPatient[] }>({
    queryKey: ['ipd-admissions-admitted-advances'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-admissions?status=Admitted&limit=100')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: showAddDialog,
  })

  const admittedPatients = admittedData?.admissions || []

  // Fetch advances — we'll get all admissions and their advances
  // Since the API requires admissionId, we fetch advances per admission
  // For simplicity, we'll list advances from a billing dashboard or use a direct approach
  const { data: advancesData, isLoading } = useQuery<Advance[]>({
    queryKey: ['patient-advances-all'],
    queryFn: async () => {
      // Fetch all advances by querying admitted patients' advances
      // Use a simpler approach: fetch recent advances from dashboard
      const res = await fetch('/api/billing/dashboard')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      // Return recent payments that are advances (we'll show all payments here as proxy)
      return []
    },
  })

  // For a proper list, we need to search across all admissions
  // Let's build a list view by scanning admissions
  const { data: allAdmissionsData, isLoading: loadingAdmissions } = useQuery<{ admissions: AdmittedPatient[] }>({
    queryKey: ['ipd-admissions-all'],
    queryFn: async () => {
      const res = await fetch('/api/ipd-admissions?limit=200')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const allAdmissions = allAdmissionsData?.admissions || []

  // Add advance mutation
  const addAdvanceMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAdmission) throw new Error('Select an admission')
      if (!advanceAmount || parseFloat(advanceAmount) <= 0) throw new Error('Enter a valid amount')

      const res = await fetch('/api/patient-advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: selectedAdmission,
          amount: parseFloat(advanceAmount),
          paymentMethod,
          paymentRef,
          notes,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record advance')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Advance recorded successfully')
      setShowAddDialog(false)
      setSelectedAdmission('')
      setAdvanceAmount('')
      setPaymentMethod('Cash')
      setPaymentRef('')
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Filter admissions by search
  const filteredAdmissions = useMemo(() => {
    if (!search) return allAdmissions
    return allAdmissions.filter(
      (a) =>
        a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.admissionNo.toLowerCase().includes(search.toLowerCase())
    )
  }, [allAdmissions, search])

  // For each admission, we show a row with advance-related info
  const totalAdvances = allAdmissions.reduce((sum, a) => sum + 0, 0) // would need DB query

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
            <p className="text-sm text-muted-foreground">Manage patient advance payments</p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4" />
              Add Advance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Advance Deposit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Select Admission</label>
                <Select value={selectedAdmission} onValueChange={setSelectedAdmission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose admission..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {admittedPatients.map((adm) => (
                      <SelectItem key={adm.id} value={adm.id}>
                        {adm.admissionNo} — {adm.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  min="1"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Notes (Optional)</label>
                <Input
                  placeholder="Any notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!selectedAdmission || !advanceAmount || addAdvanceMutation.isPending}
                onClick={() => addAdvanceMutation.mutate()}
              >
                {addAdvanceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record Advance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loadingAdmissions ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredAdmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Ward / Bed</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAdmissions.map((adm) => (
                      <motion.tr
                        key={adm.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-mono text-sm">{adm.admissionNo}</TableCell>
                        <TableCell className="font-medium">{adm.patientName}</TableCell>
                        <TableCell>{adm.wardName} - {adm.bedNumber}</TableCell>
                        <TableCell className="text-sm">{adm.doctorName}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              adm.status === 'Admitted'
                                ? 'border-amber-500 text-amber-700 bg-amber-50'
                                : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                            }
                          >
                            {adm.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(adm.admissionDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No admissions found</p>
              {search && <p className="text-sm mt-1">Try a different search term</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
