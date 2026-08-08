'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  DialogFooter,
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
  Users,
  Search,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  ShieldBan,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Loader2,
  Mail,
  Calendar,
  Phone,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const ROLES = ['All', 'admin', 'doctor', 'patient', 'hospital', 'receptionist', 'assistant', 'pharmacist']

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  doctor: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  patient: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  hospital: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  receptionist: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
  assistant: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400',
  pharmacist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
}

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  status: string
  profileImg: string
  mobileNo: string
  createdAt: string
}

interface UsersResponse {
  users: UserItem[]
  total: number
  page: number
  totalPages: number
  roleCounts: Record<string, number>
}

export default function AdminUsersPage() {
  const [role, setRole] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState<UserItem | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users', role, search, page],
    queryFn: () =>
      fetch(`/api/dashboard/admin/users?role=${role}&search=${encodeURIComponent(search)}&page=${page}`).then((r) =>
        r.json()
      ),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      toast.success('User status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Failed to update user status'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      return res.json()
    },
    onSuccess: () => {
      toast.success('User deleted')
      setDeleteUser(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleRoleChange = useCallback((value: string) => {
    setRole(value)
    setPage(1)
  }, [])

  const totalActive = data?.roleCounts ? Object.values(data.roleCounts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={data?.total ?? 0}
          icon={Users}
          trend={{ value: 12, label: 'from last month' }}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Active Users"
          value={data?.roleCounts?.Active ?? 0}
          icon={UserCheck}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Pending Users"
          value={data?.roleCounts?.Pending ?? 0}
          icon={Users}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Blocked Users"
          value={data?.roleCounts?.Block ?? 0}
          icon={UserX}
          gradient="from-red-500 to-red-600"
          iconBg="bg-red-100 dark:bg-red-900/50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Role filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    role === r
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {r === 'All' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                  {data?.roleCounts?.[r] !== undefined && (
                    <span className="ml-1.5 opacity-70">{data.roleCounts[r]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center">
                          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                          <p className="text-sm font-medium text-muted-foreground">No users found</p>
                          <p className="text-xs text-muted-foreground/70">Try adjusting your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                    <AnimatePresence>
                      {data?.users?.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ delay: i * 0.03 }}
                          className="group border-b border-border transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profileImg || ''} />
                                <AvatarFallback className="text-xs">
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                                roleColors[user.role] || 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                statusColors[user.status] || 'bg-gray-100 text-gray-700'
                              )}
                            >
                              {user.status}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewUser(user)}>
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                {user.status !== 'Active' && (
                                  <DropdownMenuItem onClick={() => statusMutation.mutate({ id: user.id, status: 'Active' })}>
                                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                                  </DropdownMenuItem>
                                )}
                                {user.status !== 'Block' && (
                                  <DropdownMenuItem onClick={() => statusMutation.mutate({ id: user.id, status: 'Block' })}>
                                    <ShieldBan className="mr-2 h-4 w-4 text-red-600" /> Block
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteUser(user)}
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

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Showing {((data.page - 1) * 10) + 1}–{Math.min(data.page * 10, data.total)} of {data.total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                      const pageNum = data.page <= 3 ? i + 1 : data.page + i - 2
                      if (pageNum < 1 || pageNum > data.totalPages) return null
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === data.page ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={viewUser.profileImg || ''} />
                  <AvatarFallback className="text-lg">{viewUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{viewUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', roleColors[viewUser.role])}>
                      {viewUser.role}
                    </span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[viewUser.status])}>
                      {viewUser.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{viewUser.email}</span>
                </div>
                {viewUser.mobileNo && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{viewUser.mobileNo}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">{format(new Date(viewUser.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This action cannot be undone. All
              related data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
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
