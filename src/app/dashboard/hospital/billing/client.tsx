'use client'

import { useQuery } from '@tanstack/react-query'
import { IndianRupee, FileText, CreditCard, Wallet, Clock, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

interface DashboardStats {
  todayCollection: number
  monthCollection: number
  pendingBills: number
  pendingAmount: number
  recentPayments: {
    id: string
    receiptNo: string
    amount: number
    paymentMethod: string
    paymentDate: string
    billNo: string
    patientName: string
    admissionNo: string
  }[]
}

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

export default function BillingDashboardClient() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['billing-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/billing/dashboard')
      if (!res.ok) throw new Error('Failed to load billing dashboard')
      return res.json()
    },
  })

  const stats = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
            <IndianRupee className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Billing Dashboard</h1>
            <p className="text-sm text-muted-foreground">Hospital billing overview and quick actions</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-teal-200 dark:border-teal-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Today&apos;s Collection</p>
                      <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                        {formatCurrency(stats?.todayCollection || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/30">
                      <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Collection</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatCurrency(stats?.monthCollection || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Bills</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {stats?.pendingBills || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-rose-200 dark:border-rose-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {formatCurrency(stats?.pendingAmount || 0)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30">
                      <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/dashboard/hospital/billing/ipd">
              <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Generate IPD Bill</p>
                  <p className="text-xs text-muted-foreground">Create new IPD bill</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/dashboard/hospital/billing/payments">
              <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Record Payment</p>
                  <p className="text-xs text-muted-foreground">Collect bill payment</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
            <Link href="/dashboard/hospital/billing/advances">
              <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Record Advance</p>
                  <p className="text-xs text-muted-foreground">Accept advance deposit</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Payments</CardTitle>
          <Link href="/dashboard/hospital/billing/payments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats?.recentPayments && stats.recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.receiptNo}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.billNo}</TableCell>
                      <TableCell className="font-medium">{payment.patientName || '—'}</TableCell>
                      <TableCell>{getMethodBadge(payment.paymentMethod)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No recent payments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
