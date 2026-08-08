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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Stethoscope,
  Search,
  MoreHorizontal,
  Eye,
  ShieldCheck,
  ShieldBan,
  Star,
  MapPin,
  Loader2,
  GraduationCap,
  Briefcase,
  IndianRupee,
  Clock,
  UserCheck,
  UserX,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

interface DoctorItem {
  id: string
  userId: string
  name: string
  email: string
  profileImg: string
  specialization: string
  city: string
  fees: number
  status: string
  avgRating: number
  totalRatings: number
  experience: string
  education: string
  description: string
  address: string
  contactNo: string
  createdAt: string
}

interface DoctorsResponse {
  doctors: DoctorItem[]
  cities: string[]
  specializations: string[]
  totalActive: number
  totalPending: number
}

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [specFilter, setSpecFilter] = useState('all')
  const [viewDoctor, setViewDoctor] = useState<DoctorItem | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ id: string; userId: string; status: string } | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<DoctorsResponse>({
    queryKey: ['admin-doctors', search, cityFilter, specFilter],
    queryFn: () =>
      fetch(`/api/dashboard/admin/doctors?search=${encodeURIComponent(search)}&city=${cityFilter}&specialization=${specFilter}`).then(
        (r) => r.json()
      ),
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dashboard/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (_, variables) => {
      toast.success(`Doctor ${variables.status === 'Active' ? 'activated' : 'blocked'}`)
      setStatusTarget(null)
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] })
    },
    onError: () => toast.error('Failed to update doctor status'),
  })

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Doctors"
          value={data?.doctors?.length ?? 0}
          icon={Stethoscope}
          trend={{ value: 8, label: 'from last month' }}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Active Doctors"
          value={data?.totalActive ?? 0}
          icon={UserCheck}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Pending Verification"
          value={data?.totalPending ?? 0}
          icon={Clock}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="Blocked"
          value={0}
          icon={UserX}
          gradient="from-red-500 to-red-600"
          iconBg="bg-red-100 dark:bg-red-900/50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <MapPin className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {data?.cities?.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Stethoscope className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {data?.specializations?.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Doctors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="hidden md:table-cell">Specialization</TableHead>
                    <TableHead className="hidden lg:table-cell">City</TableHead>
                    <TableHead className="hidden sm:table-cell">Fees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Rating</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.doctors?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <Stethoscope className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No doctors found</p>
                      </TableCell>
                    </TableRow>
                  )}
                  <AnimatePresence>
                    {data?.doctors?.map((doc, i) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={doc.profileImg || ''} />
                              <AvatarFallback className="text-xs">{doc.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground md:hidden">{doc.specialization}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{doc.specialization}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{doc.city}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-medium">
                          ₹{doc.fees.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[doc.status])}>
                            {doc.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium">{doc.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({doc.totalRatings})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewDoctor(doc)}>
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                              </DropdownMenuItem>
                              {doc.status !== 'Active' && (
                                <DropdownMenuItem onClick={() => setStatusTarget({ id: doc.userId, status: 'Active' })}>
                                  <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" /> Activate
                                </DropdownMenuItem>
                              )}
                              {doc.status !== 'Block' && (
                                <DropdownMenuItem onClick={() => setStatusTarget({ id: doc.userId, status: 'Block' })}>
                                  <ShieldBan className="mr-2 h-4 w-4 text-red-600" /> Block
                                </DropdownMenuItem>
                              )}
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

      {/* View Doctor Dialog */}
      <Dialog open={!!viewDoctor} onOpenChange={() => setViewDoctor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Doctor Profile</DialogTitle>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={viewDoctor.profileImg || ''} />
                  <AvatarFallback className="text-xl">{viewDoctor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewDoctor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[viewDoctor.status])}>
                      {viewDoctor.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{viewDoctor.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({viewDoctor.totalRatings} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 text-sm">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Specialization</p>
                    <p className="font-medium">{viewDoctor.specialization}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Education</p>
                    <p className="font-medium">{viewDoctor.education}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Experience</p>
                    <p className="font-medium">{viewDoctor.experience}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{viewDoctor.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Consultation Fee</p>
                    <p className="font-medium">₹{viewDoctor.fees.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p className="font-medium">{viewDoctor.contactNo || viewDoctor.email}</p>
                  </div>
                </div>
              </div>
              {viewDoctor.description && (
                <div className="rounded-lg border border-border p-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">About</p>
                  <p className="text-sm leading-relaxed">{viewDoctor.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <AlertDialog open={!!statusTarget} onOpenChange={() => setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusTarget?.status === 'Active' ? 'Activate Doctor' : 'Block Doctor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusTarget?.status === 'Active' ? 'activate' : 'block'} this doctor?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                statusTarget?.status === 'Active'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-destructive text-white hover:bg-destructive/90'
              )}
              onClick={() =>
                statusTarget && statusMutation.mutate({ id: statusTarget.id, status: statusTarget.status })
              }
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {statusTarget?.status === 'Active' ? 'Activate' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
