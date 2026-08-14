'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, Save, User, Building2, Phone, Award, Microscope } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileData {
  id: string
  employeeId: string
  qualification: string
  specialization: string
  phoneNo: string
  status: string
  user: {
    name: string
    email: string
    mobileNo: string
    profileImg: string
    gender: string
  }
  hospital: {
    name: string
  }
}

export default function LabTechProfileClient() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [qualification, setQualification] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [phoneNo, setPhoneNo] = useState('')

  const { data, isLoading } = useQuery<{ profile: ProfileData }>({
    queryKey: ['lab-tech-profile'],
    queryFn: () => fetch('/api/lab-technician/profile').then((r) => r.json()),
  })

  const profile = data?.profile

  // Sync form when data loads
  useState(() => {
    if (profile && !isEditing) {
      setQualification(profile.qualification)
      setSpecialization(profile.specialization)
      setPhoneNo(profile.phoneNo)
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/lab-technician/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualification, specialization, phoneNo }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Update failed') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tech-profile'] })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function startEditing() {
    if (profile) {
      setQualification(profile.qualification)
      setSpecialization(profile.specialization)
      setPhoneNo(profile.phoneNo)
    }
    setIsEditing(true)
  }

  function getInitials(name: string) {
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your lab technician profile</p>
        </div>
        {!isEditing ? (
          <Button onClick={startEditing} className="bg-teal-600 hover:bg-teal-700">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : profile ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Avatar className="mb-4 h-24 w-24">
                <AvatarImage src={profile.user.profileImg || ''} alt={profile.user.name} />
                <AvatarFallback className="bg-teal-100 text-2xl font-bold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                  {getInitials(profile.user.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">{profile.user.name}</h2>
              <p className="text-sm text-muted-foreground">Lab Technician</p>
              {profile.specialization && (
                <Badge className="mt-2 bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-400">
                  <Microscope className="mr-1 h-3 w-3" />
                  {profile.specialization}
                </Badge>
              )}
              <div className="mt-4 w-full space-y-3 border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Hospital:</span>
                  <span className="ml-auto font-medium">{profile.hospital.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Employee ID:</span>
                  <span className="ml-auto font-medium">{profile.employeeId || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="ml-auto border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                    {profile.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.user.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input value={profile.user.gender} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={isEditing ? phoneNo : profile.user.mobileNo}
                    onChange={(e) => setPhoneNo(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={isEditing ? qualification : profile.qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. BSc MLT, DMLT"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={isEditing ? specialization : profile.specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Clinical Pathology"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
