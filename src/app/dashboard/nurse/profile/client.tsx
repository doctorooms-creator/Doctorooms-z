'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Building2,
  BedDouble,
  Mail,
  Phone,
  MapPin,
  Shield,
  Clock,
  Pencil,
  Save,
  X,
  GraduationCap,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NurseProfile {
  id: string
  name: string
  email: string
  gender: string
  mobileNo: string
  profileImg: string
  employeeId: string
  qualification: string
  designation: string
  shift: string
  phoneNo: string
  address: string
  hospital: { id: string; hospitalName: string; city: string; state: string } | null
  ward: { id: string; name: string; wardType: string; floorNo: string } | null
  createdAt: string
}

function getShiftIcon(shift: string) {
  switch (shift) {
    case 'Morning': return <Sun className="h-4 w-4" />
    case 'Evening': return <Sunset className="h-4 w-4" />
    case 'Night': return <Moon className="h-4 w-4" />
    default: return <Clock className="h-4 w-4" />
  }
}

function getShiftBadge(shift: string) {
  switch (shift) {
    case 'Morning':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-400">{getShiftIcon(shift)} Morning (7AM-2PM)</Badge>
    case 'Evening':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">{getShiftIcon(shift)} Evening (2PM-9PM)</Badge>
    case 'Night':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-400">{getShiftIcon(shift)} Night (9PM-7AM)</Badge>
    case 'Rotating':
      return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400"><Clock className="h-4 w-4" /> Rotating</Badge>
    default:
      return <Badge variant="secondary">{shift}</Badge>
  }
}

function getWardTypeBadge(type: string) {
  switch (type) {
    case 'ICU':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400">ICU</Badge>
    case 'General':
      return <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">General</Badge>
    case 'Private':
      return <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-400">Private</Badge>
    case 'SemiPrivate':
      return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400">Semi-Private</Badge>
    default:
      return <Badge variant="outline">{type}</Badge>
  }
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function NurseProfileClient() {
  const [isEditing, setIsEditing] = useState(false)
  const [phoneNo, setPhoneNo] = useState('')
  const [address, setAddress] = useState('')
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery<NurseProfile>({
    queryKey: ['nurse-profile'],
    queryFn: () => fetch('/api/dashboard/nurse/profile').then(r => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { phoneNo: string; address: string }) =>
      fetch('/api/dashboard/nurse/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success('Profile updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['nurse-profile'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const startEdit = () => {
    setPhoneNo(profile?.phoneNo || '')
    setAddress(profile?.address || '')
    setIsEditing(true)
  }

  const cancelEdit = () => setIsEditing(false)

  const saveProfile = () => {
    updateMutation.mutate({ phoneNo, address })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">View and manage your nurse profile</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden">
          {/* Teal gradient header */}
          <div className="relative h-32 bg-gradient-to-r from-teal-500 to-teal-600">
            <div className="absolute -bottom-12 left-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-900/50 dark:text-teal-400">
                {getInitials(profile?.name || 'N')}
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{profile?.name}</h2>
                  {profile?.employeeId && (
                    <Badge variant="outline" className="font-mono text-xs">{profile.employeeId}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">
                    <Shield className="mr-1 h-3 w-3" />
                    {profile?.designation || 'Staff Nurse'}
                  </Badge>
                  {profile?.qualification && (
                    <Badge variant="outline" className="text-xs">
                      <GraduationCap className="mr-1 h-3 w-3" />
                      {profile.qualification}
                    </Badge>
                  )}
                  {profile?.shift && getShiftBadge(profile.shift)}
                </div>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Details Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Hospital */}
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Hospital</p>
                  <p className="text-sm font-medium">{profile?.hospital?.hospitalName || '—'}</p>
                  {profile?.hospital?.city && (
                    <p className="text-xs text-muted-foreground">{profile.hospital.city}{profile.hospital.state ? `, ${profile.hospital.state}` : ''}</p>
                  )}
                </div>
              </div>

              {/* Ward */}
              <div className="flex items-start gap-3">
                <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Ward</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{profile?.ward?.name || 'Floating'}</p>
                    {profile?.ward && getWardTypeBadge(profile.ward.wardType)}
                  </div>
                  {profile?.ward?.floorNo && (
                    <p className="text-xs text-muted-foreground">{profile.ward.floorNo}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{profile?.email || '—'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Contact Number</p>
                  {isEditing ? (
                    <Input value={phoneNo} onChange={e => setPhoneNo(e.target.value)} placeholder="Enter phone number" className="mt-1 h-8 text-sm" />
                  ) : (
                    <p className="text-sm font-medium">{profile?.phoneNo || profile?.mobileNo || '—'}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Address</p>
                  {isEditing ? (
                    <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter address" className="mt-1 min-h-[60px] text-sm" />
                  ) : (
                    <p className="text-sm font-medium">{profile?.address || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <>
                <Separator />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEdit} disabled={updateMutation.isPending}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveProfile} disabled={updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
