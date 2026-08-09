'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserCircle,
  Phone,
  Calendar,
  MapPin,
  Stethoscope,
  Camera,
  Loader2,
  IndianRupee,
  Edit3,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProfileData {
  id: string
  address: string
  createdAt: string
  doctor: {
    id: string
    name: string
    profileImg: string
    email: string
    mobileNo: string
    specialization: string
    fees: number
    city: string
    state: string
  }
  user: {
    id: string
    name: string
    email: string
    mobileNo: string
    gender: string
    profileImg: string
    status: string
    createdAt: string
  }
}

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Block: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
}

export default function ReceptionistProfilePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formMobile, setFormMobile] = useState('')
  const [formGender, setFormGender] = useState('')
  const [formAddress, setFormAddress] = useState('')

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['receptionist-profile'],
    queryFn: () => fetch('/api/receptionist/profile').then(r => r.json()),
  })

  const openEdit = () => {
    if (profile) {
      setFormName(profile.user.name)
      setFormMobile(profile.user.mobileNo)
      setFormGender(profile.user.gender)
      setFormAddress(profile.address)
    }
    setEditOpen(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      fetch('/api/receptionist/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['receptionist-profile'] })
      setEditOpen(false)
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const avatarMutation = useMutation({
    mutationFn: (formData: FormData) =>
      fetch('/api/receptionist/avatar', {
        method: 'POST',
        body: formData,
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Avatar updated')
      queryClient.invalidateQueries({ queryKey: ['receptionist-profile'] })
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP images allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    const formData = new FormData()
    formData.append('avatar', file)
    avatarMutation.mutate(formData)
  }

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error('Name is required')
      return
    }
    updateMutation.mutate({
      name: formName.trim(),
      mobileNo: formMobile,
      gender: formGender,
      address: formAddress,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-52 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) return null

  const u = profile.user
  const d = profile.doctor

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-start"
      >
        <div className="relative group">
          <Avatar className="h-20 w-20">
            <AvatarImage src={u.profileImg || ''} />
            <AvatarFallback className="bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
              {u.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Change avatar"
          >
            <Camera className="h-5 w-5 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <h2 className="text-xl font-bold">{u.name}</h2>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[u.status] || '')}>
              {u.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{u.email}</p>
          <Button variant="outline" size="sm" onClick={openEdit} className="mt-3 gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="text-sm font-medium">{u.mobileNo || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                <UserCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="text-sm font-medium">{u.gender || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">{format(new Date(u.createdAt), 'MMM d, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{profile.address || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Linked Doctor Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-teal-200 dark:border-teal-900">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">Working with</p>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={d.profileImg || ''} />
                <AvatarFallback className="bg-teal-100 text-lg font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                  {d.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-base font-semibold">Dr. {d.name}</p>
                {d.specialization && <p className="text-sm text-muted-foreground">{d.specialization}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  {d.city && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{d.city}{d.state ? `, ${d.state}` : ''}</span>}
                  {d.fees > 0 && <span className="flex items-center gap-1 font-medium"><IndianRupee className="h-3.5 w-3.5" />{d.fees.toLocaleString('en-IN')}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Name *</Label>
              <Input id="editName" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMobile">Mobile</Label>
              <Input id="editMobile" value={formMobile} onChange={e => setFormMobile(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editGender">Gender</Label>
              <Select value={formGender} onValueChange={setFormGender}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddress">Address</Label>
              <Input id="editAddress" value={formAddress} onChange={e => setFormAddress(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
