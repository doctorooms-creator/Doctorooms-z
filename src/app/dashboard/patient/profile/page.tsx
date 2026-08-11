'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GENDERS } from '@/lib/constants'
import { User, Mail, Phone, Camera, Save, X, Calendar, Shield, KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  name: string
  email: string
  mobileNo: string
  gender: string
  profileImg: string
  createdAt: string
}

function getAvatarUrl(profileImg: string | null | undefined): string {
  if (!profileImg || profileImg === 'default.png') return '/default.png'
  if (profileImg.startsWith('http://') || profileImg.startsWith('https://') || profileImg.startsWith('/')) return profileImg
  // Bare filename → Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/avatars/${profileImg}`
  return `/uploads/profile/${profileImg}`
}

function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-24 bg-muted sm:h-28" />
        <div className="flex flex-col items-center gap-4 px-6 pb-6 -mt-12">
          <div className="h-24 w-24 rounded-full border-4 border-background animate-pulse bg-muted" />
          <div className="space-y-2 text-center">
            <div className="h-5 w-36 mx-auto animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 mx-auto animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PatientProfilePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    mobileNo: '',
    gender: 'Male',
  })

  const { data, isLoading } = useQuery<{ profile: Profile }>({
    queryKey: ['patient-profile'],
    queryFn: () => fetch('/api/patient/profile').then((r) => r.json()),
  })

  const profile = data?.profile
  const avatarUrl = getAvatarUrl(profile?.profileImg)

  const startEditing = () => {
    if (profile) {
      setForm({
        name: profile.name || '',
        mobileNo: profile.mobileNo || '',
        gender: profile.gender || 'Male',
      })
    }
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/patient/avatar', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
      toast.success('Profile photo updated!')
    },
    onError: () => toast.error('Failed to upload photo'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    avatarMutation.mutate(file)
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
      // Update Zustand auth store so header shows new name immediately
      const store = useAuthStore.getState()
      if (store.user) {
        useAuthStore.getState().setUser({ ...store.user, name: form.name, mobileNo: form.mobileNo, gender: form.gender })
      }
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const displayName = isEditing ? form.name : (profile?.name || user?.name || '—')
  const displayMobile = isEditing ? form.mobileNo : (profile?.mobileNo || 'Not provided')
  const displayGender = isEditing ? form.gender : (profile?.gender || 'Male')

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          {/* Hero gradient band */}
          <div className="h-24 bg-gradient-to-r from-teal-500 to-teal-600 sm:h-28" />
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col items-center text-center -mt-12">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="rounded-full border-4 border-background">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                      {(profile?.name || user?.name || 'P')
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
                  {avatarMutation.isPending ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-teal-500 text-white">
                  <Camera className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-3 text-xl font-bold">{profile?.name || user?.name || '—'}</h3>
              <p className="text-sm text-muted-foreground">Patient</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email || user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
                onClick={startEditing}
              >
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="flex h-10 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm">
                    {displayName}
                  </div>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm">
                  <span>{profile?.email || user?.email}</span>
                  <Shield className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">Email cannot be changed</p>
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Mobile Number
                </Label>
                {isEditing ? (
                  <Input
                    id="mobile"
                    value={form.mobileNo}
                    onChange={(e) => setForm((f) => ({ ...f, mobileNo: e.target.value }))}
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <div className="flex h-10 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm">
                    {displayMobile}
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Gender
                </Label>
                {isEditing ? (
                  <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex h-10 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm">
                    {displayGender}
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={cancelEditing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />

      {/* Change Password Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="py-4">
            <button
              onClick={() => window.location.href = '/dashboard/change-password'}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/50 dark:hover:text-teal-400"
            >
              <KeyRound className="h-5 w-5" />
              <span>Change Password</span>
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
