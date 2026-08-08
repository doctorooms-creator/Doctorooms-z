'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Pencil,
  Save,
  X,
  Camera,
  MapPin,
  GraduationCap,
  Award,
  Phone,
  Stethoscope,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'

interface DoctorProfile {
  id: string
  name: string
  email: string
  profileImg: string
  mobileNo: string
  gender: string
  specialization: string
  education: string
  experience: string
  fees: number
  emergencyCharge: number
  address: string
  city: string
  state: string
  description: string
  awardAndRecognition: string
  contactNo: string
  hospitalAddress: string
  doctorType: string
  registrationDetail: string
  isEmergency: boolean
}

export default function DoctorProfilePage() {
  const { user: _user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<Partial<DoctorProfile> | null>(null)

  const { data, isLoading } = useQuery<{ doctor: DoctorProfile }>({
    queryKey: ['doctor-profile'],
    queryFn: () => fetch('/api/dashboard/doctor/profile').then((r) => r.json()),
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/dashboard/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const doctor = data?.doctor
  const displayData = form ?? doctor

  const startEditing = () => {
    if (doctor) {
      setForm({ ...doctor })
      setIsEditing(true)
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleSave = () => {
    if (form) updateMutation.mutate(form)
  }

  const handleCancel = () => {
    setForm(null)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <User className="h-12 w-12 mb-3 opacity-40" />
        <p className="font-medium">Profile not found</p>
        <p className="text-sm mt-1">Complete your doctor profile to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={doctor.profileImg || ''} />
                    <AvatarFallback className="text-2xl bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                      {doctor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white shadow-md hover:bg-teal-700 transition-colors">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{doctor.name}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    {doctor.specialization || 'No specialization set'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{doctor.email}</p>
                </div>
              </div>
              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="mr-1 h-4 w-4" /> Cancel
                    </Button>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={updateMutation.isPending}>
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil className="mr-1 h-4 w-4" /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full Name"
                icon={<User className="h-3.5 w-3.5" />}
                value={displayData?.name || ''}
                onChange={(v) => updateField('name', v)}
                editing={isEditing}
              />
              <FormField
                label="Specialization"
                icon={<Stethoscope className="h-3.5 w-3.5" />}
                value={displayData?.specialization || ''}
                onChange={(v) => updateField('specialization', v)}
                editing={isEditing}
              />
              <FormField
                label="Education"
                icon={<GraduationCap className="h-3.5 w-3.5" />}
                value={displayData?.education || ''}
                onChange={(v) => updateField('education', v)}
                editing={isEditing}
              />
              <FormField
                label="Experience"
                value={displayData?.experience || ''}
                onChange={(v) => updateField('experience', v)}
                editing={isEditing}
              />
              <FormField
                label="Consultation Fee (₹)"
                value={String(displayData?.fees || 0)}
                onChange={(v) => updateField('fees', parseFloat(v) || 0)}
                editing={isEditing}
                type="number"
              />
              <FormField
                label="Emergency Charge (₹)"
                value={String(displayData?.emergencyCharge || 0)}
                onChange={(v) => updateField('emergencyCharge', parseFloat(v) || 0)}
                editing={isEditing}
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Emergency Available</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!displayData?.isEmergency}
                  onCheckedChange={(checked) => updateField('isEmergency', checked)}
                  disabled={!isEditing}
                />
                <span className="text-sm">{displayData?.isEmergency ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Contact & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Contact Number"
                icon={<Phone className="h-3.5 w-3.5" />}
                value={displayData?.contactNo || ''}
                onChange={(v) => updateField('contactNo', v)}
                editing={isEditing}
              />
              <FormField
                label="Mobile Number"
                icon={<Phone className="h-3.5 w-3.5" />}
                value={displayData?.mobileNo || ''}
                onChange={(v) => updateField('mobileNo', v)}
                editing={isEditing}
              />
            </div>
            <FormField
              label="Address"
              icon={<MapPin className="h-3.5 w-3.5" />}
              value={displayData?.address || ''}
              onChange={(v) => updateField('address', v)}
              editing={isEditing}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="City"
                value={displayData?.city || ''}
                onChange={(v) => updateField('city', v)}
                editing={isEditing}
              />
              <FormField
                label="State"
                value={displayData?.state || ''}
                onChange={(v) => updateField('state', v)}
                editing={isEditing}
              />
            </div>
            <FormField
              label="Hospital/Clinic Address"
              value={displayData?.hospitalAddress || ''}
              onChange={(v) => updateField('hospitalAddress', v)}
              editing={isEditing}
            />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">About & Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Description / Bio</Label>
              {isEditing ? (
                <Textarea
                  value={displayData?.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Tell patients about yourself..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{doctor.description || 'No description added yet.'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" /> Awards & Recognition
              </Label>
              {isEditing ? (
                <Textarea
                  value={displayData?.awardAndRecognition || ''}
                  onChange={(e) => updateField('awardAndRecognition', e.target.value)}
                  rows={3}
                  placeholder="List your awards and recognition..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{doctor.awardAndRecognition || 'No awards listed.'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Registration Details</Label>
              {isEditing ? (
                <Input
                  value={displayData?.registrationDetail || ''}
                  onChange={(e) => updateField('registrationDetail', e.target.value)}
                  placeholder="Medical registration number"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{doctor.registrationDetail || '—'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function FormField({
  label,
  value,
  onChange,
  editing,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  editing: boolean
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </Label>
      {editing ? (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      ) : (
        <p className="text-sm font-medium py-1.5">{value || '—'}</p>
      )}
    </div>
  )
}