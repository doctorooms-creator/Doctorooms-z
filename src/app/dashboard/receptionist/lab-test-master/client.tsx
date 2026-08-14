'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, FlaskConical, ListOrdered, Eye, X } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ Types ============

interface LabTestParameter {
  paramName: string
  shortCode: string
  unit: string
  normalMaleMin: number
  normalMaleMax: number
  normalFemaleMin: number
  normalFemaleMax: number
  normalChildMin: number
  normalChildMax: number
  sortOrder: number
}

interface LabTestMaster {
  id: string
  name: string
  shortCode: string
  category: string
  description: string
  specimenType: string
  reportDays: number
  rate: number
  status: string
  sortOrder: number
  _count: { parameters: number }
}

// ============ Helpers ============

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString('en-IN')}`
}

function getCategoryBadgeColor(cat: string) {
  const colors: Record<string, string> = {
    Haematology: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    Biochemistry: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    Microbiology: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    Serology: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
    Urine: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    Thyroid: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    Hormones: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
  }
  return colors[cat] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

// ============ Main Component ============

export default function ReceptionistLabTestMasterClient() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  // Fetch test masters (same API as hospital)
  const { data, isLoading } = useQuery<{ testMasters: LabTestMaster[] }>({
    queryKey: ['lab-test-masters', categoryFilter, search],
    queryFn: () => {
      const params = new URLSearchParams()
      if (categoryFilter) params.set('category', categoryFilter)
      if (search) params.set('search', search)
      return fetch(`/api/lab-test-masters?${params}`).then((r) => r.json())
    },
  })

  const testMasters = data?.testMasters || []

  // Extract unique categories from data for filter
  const categories = useMemo(() => {
    const cats = new Set(testMasters.map((t) => t.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [testMasters])

  // Fetch detail for dialog
  const { data: detailData, isLoading: detailLoading } = useQuery<{
    testMaster: LabTestMaster & { parameters: LabTestParameter[] }
  }>({
    queryKey: ['lab-test-master-detail', detailId],
    queryFn: () => fetch(`/api/lab-test-masters/${detailId}`).then((r) => r.json()),
    enabled: !!detailId,
  })

  const selectedTest = detailData?.testMaster

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
            <ListOrdered className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lab Test Master</h1>
            <p className="text-sm text-muted-foreground">
              View available lab tests and their parameters
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v === '_all' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : testMasters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No lab tests found
              </p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Short Code</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Specimen Type</TableHead>
                    <TableHead className="hidden md:table-cell text-center">
                      TAT
                    </TableHead>
                    <TableHead className="hidden md:table-cell text-right">
                      Rate
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testMasters.map((test, idx) => (
                    <motion.tr
                      key={test.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                      onClick={() => setDetailId(test.id)}
                    >
                      <TableCell className="text-muted-foreground text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{test.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {test.shortCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {test.shortCode || '—'}
                        </code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {test.category && (
                          <Badge
                            variant="secondary"
                            className={getCategoryBadgeColor(test.category)}
                          >
                            {test.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {test.specimenType || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center text-sm">
                        {test.reportDays > 0 ? (
                          <Badge variant="outline" className="font-normal">
                            {test.reportDays} {test.reportDays === 1 ? 'day' : 'days'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right font-medium">
                        {test.rate > 0 ? formatCurrency(test.rate) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {test.status === 'Active' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedTest ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  {selectedTest.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedTest.description || 'No description available'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Test Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Short Code
                    </p>
                    <p className="mt-1 font-semibold">
                      {selectedTest.shortCode || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-1">
                      {selectedTest.category ? (
                        <Badge
                          variant="secondary"
                          className={getCategoryBadgeColor(selectedTest.category)}
                        >
                          {selectedTest.category}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Specimen Type
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedTest.specimenType || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Turnaround Time
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedTest.reportDays > 0
                        ? `${selectedTest.reportDays} ${selectedTest.reportDays === 1 ? 'day' : 'days'}`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Rate
                    </p>
                    <p className="mt-1 text-lg font-bold text-teal-600 dark:text-teal-400">
                      {selectedTest.rate > 0
                        ? formatCurrency(selectedTest.rate)
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1">
                      {selectedTest.status === 'Active' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        >
                          Inactive
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Parameters Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-sm font-semibold">
                      Parameters ({selectedTest.parameters?.length || 0})
                    </h3>
                  </div>

                  {selectedTest.parameters && selectedTest.parameters.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Unit
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              Male Range
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              Female Range
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTest.parameters
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((param, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {param.paramName}
                                    </p>
                                    <code className="text-xs text-muted-foreground">
                                      {param.shortCode}
                                    </code>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm">
                                  {param.unit || '—'}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {param.normalMaleMin || param.normalMaleMax ? (
                                    <span className="text-sm text-teal-600 dark:text-teal-400">
                                      {param.normalMaleMin} – {param.normalMaleMax}{' '}
                                      {param.unit || ''}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  {param.normalFemaleMin || param.normalFemaleMax ? (
                                    <span className="text-sm text-pink-600 dark:text-pink-400">
                                      {param.normalFemaleMin} –{' '}
                                      {param.normalFemaleMax} {param.unit || ''}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed py-8">
                      <p className="text-sm text-muted-foreground">
                        No parameters defined for this test
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
