'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Mail,
  MailOpen,
  MailCheck,
  Clock,
  Phone,
  User,
  Calendar,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface InquiryItem {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: string
  createdAt: string
}

interface InquiriesResponse {
  inquiries: InquiryItem[]
  total: number
  unread: number
  read: number
}

export default function AdminInquiriesPage() {
  const [search, setSearch] = useState('')
  const [viewInquiry, setViewInquiry] = useState<InquiryItem | null>(null)
  const [deleteInquiry, setDeleteInquiry] = useState<InquiryItem | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<InquiriesResponse>({
    queryKey: ['admin-inquiries', search],
    queryFn: () =>
      fetch(`/api/dashboard/admin/inquiries?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/admin/inquiries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Inquiry status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] })
    },
    onError: () => toast.error('Failed to update inquiry status'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/admin/inquiries`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Inquiry deleted')
      setDeleteInquiry(null)
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] })
    },
    onError: () => toast.error('Failed to delete inquiry'),
  })

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Inquiries"
          value={data?.total ?? 0}
          icon={MessageSquare}
          trend={{ value: 10, label: 'from last month' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Unread"
          value={data?.unread ?? 0}
          icon={Mail}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Read"
          value={data?.read ?? 0}
          icon={MailCheck}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Avg Response"
          value="—"
          icon={Clock}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inquiries table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Contact Inquiries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.inquiries?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No inquiries yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                  <AnimatePresence>
                    {data?.inquiries?.map((inq, i) => (
                      <motion.tr
                        key={inq.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          'border-b border-border transition-colors hover:bg-muted/50',
                          inq.status === 'Pending' && 'bg-amber-50/50 dark:bg-amber-950/10'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full',
                                inq.status === 'Pending'
                                  ? 'bg-amber-100 dark:bg-amber-900/50'
                                  : 'bg-muted'
                              )}
                            >
                              {inq.status === 'Pending' ? (
                                <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-sm font-medium">{inq.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {inq.email}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm max-w-[200px] truncate">
                          {inq.subject}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              inq.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                            )}
                          >
                            {inq.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {format(new Date(inq.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewInquiry(inq)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              {inq.status === 'Pending' && (
                                <DropdownMenuItem
                                  onClick={() => statusMutation.mutate({ id: inq.id, status: 'Read' })}
                                >
                                  <MailCheck className="mr-2 h-4 w-4 text-emerald-600" /> Mark as Read
                                </DropdownMenuItem>
                              )}
                              {inq.status === 'Read' && (
                                <DropdownMenuItem
                                  onClick={() => statusMutation.mutate({ id: inq.id, status: 'Pending' })}
                                >
                                  <Mail className="mr-2 h-4 w-4 text-amber-600" /> Mark as Unread
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteInquiry(inq)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Inquiry Dialog */}
      <Dialog open={!!viewInquiry} onOpenChange={() => setViewInquiry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
          </DialogHeader>
          {viewInquiry && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    viewInquiry.status === 'Pending'
                      ? 'bg-amber-100 dark:bg-amber-900/50'
                      : 'bg-emerald-100 dark:bg-emerald-900/50'
                  )}
                >
                  <MessageSquare
                    className={cn(
                      'h-6 w-6',
                      viewInquiry.status === 'Pending'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewInquiry.subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        viewInquiry.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                      )}
                    >
                      {viewInquiry.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(viewInquiry.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{viewInquiry.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{viewInquiry.email}</span>
                </div>
                {viewInquiry.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{viewInquiry.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Received:</span>
                  <span className="font-medium">
                    {format(new Date(viewInquiry.createdAt), 'MMMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Message</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{viewInquiry.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInquiry} onOpenChange={() => setDeleteInquiry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this inquiry from <strong>{deleteInquiry?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteInquiry && deleteMutation.mutate(deleteInquiry.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
