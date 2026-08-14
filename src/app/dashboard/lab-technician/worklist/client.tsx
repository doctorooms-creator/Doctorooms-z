'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TestTube, FlaskConical, PenLine, CheckCircle2, AlertTriangle, Clock, Loader2, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface WorklistItem {
  id: string
  reportNo: string
  patientName: string
  patientAge: number
  patientGender: string
  status: string
  urgency: string
  createdAt: string
  testMaster: {
    name: string
    shortCode: string
    category: string
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Ordered':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">Ordered</Badge>
    case 'SampleCollected':
      return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">Collected</Badge>
    case 'ResultEntered':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400">Result Entered</Badge>
    case 'Verified':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400">Verified</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getUrgencyBadge(urgency: string) {
  if (urgency === 'Urgent') {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400"><AlertTriangle className="mr-1 h-3 w-3" />Urgent</Badge>
  }
  return <Badge variant="outline">Normal</Badge>
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function WorklistClient() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [collectId, setCollectId] = useState<string | null>(null)

  // Build status filter based on tab
  let statusFilter = 'Ordered,SampleCollected'
  if (activeTab === 'ordered') statusFilter = 'Ordered'
  else if (activeTab === 'collected') statusFilter = 'SampleCollected'

  const { data, isLoading, refetch } = useQuery<{ worklist: WorklistItem[] }>({
    queryKey: ['lab-worklist', statusFilter, urgencyFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set('status', statusFilter)
      if (urgencyFilter) params.set('urgency', urgencyFilter)
      return fetch(`/api/lab-reports/worklist?${params}`).then((r) => r.json())
    },
    refetchInterval: 15000,
  })

  const worklist = data?.worklist || []

  // Collect sample mutation
  const collectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lab-reports/${id}/collect-sample`, { method: 'PUT' })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Sample collected successfully')
      queryClient.invalidateQueries({ queryKey: ['lab-worklist'] })
      setCollectId(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function getActionButtons(item: WorklistItem) {
    if (item.status === 'Ordered') {
      return (
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => setCollectId(item.id)}
        >
          <TestTube className="mr-1 h-3 w-3" /> Collect
        </Button>
      )
    }
    if (item.status === 'SampleCollected') {
      return (
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => router.push(`/dashboard/lab-technician/result-entry/${item.id}`)}
        >
          <PenLine className="mr-1 h-3 w-3" /> Enter Result
        </Button>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Lab Worklist</h1>
          <p className="text-sm text-muted-foreground">Manage sample collection and result entry</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Priority</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Clock className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> All ({worklist.length})
          </TabsTrigger>
          <TabsTrigger value="ordered" className="gap-1.5">
            <TestTube className="h-4 w-4" /> Pending Collection
          </TabsTrigger>
          <TabsTrigger value="collected" className="gap-1.5">
            <PenLine className="h-4 w-4" /> Awaiting Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : worklist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FlaskConical className="mb-3 h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No items in worklist</p>
                  <p className="text-xs text-muted-foreground">New orders will appear here</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead className="hidden sm:table-cell">Test</TableHead>
                        <TableHead className="hidden md:table-cell">Priority</TableHead>
                        <TableHead className="hidden md:table-cell">Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Time</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {worklist.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.reportNo}</code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.patientName}</p>
                              <p className="text-xs text-muted-foreground">{item.patientAge}y, {item.patientGender}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div>
                              <p className="text-sm">{item.testMaster.name}</p>
                              {item.testMaster.category && (
                                <p className="text-xs text-muted-foreground">{item.testMaster.category}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{getUrgencyBadge(item.urgency)}</TableCell>
                          <TableCell className="hidden md:table-cell">{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{timeAgo(item.createdAt)}</TableCell>
                          <TableCell className="text-right">{getActionButtons(item)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Collect Sample Confirmation */}
      <AlertDialog open={!!collectId} onOpenChange={(open) => { if (!open) setCollectId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Collect Sample</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this sample as collected? The status will change to &quot;Sample Collected&quot; and it will be ready for result entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => collectId && collectMutation.mutate(collectId)}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={collectMutation.isPending}
            >
              {collectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Collect Sample
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
