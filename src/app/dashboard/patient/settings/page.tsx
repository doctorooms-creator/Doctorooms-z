'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sun, Moon, Monitor, Bell, Mail, CalendarCheck,
  Megaphone, Shield, Palette, Save, Loader2, AlertTriangle, ArrowLeft, Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface UserSettings {
  emailNotifications: boolean
  bookingReminders: boolean
  marketingEmails: boolean
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function ThemeOption({ value, label, description, icon: Icon, currentTheme, onSelect }: {
  value: string; label: string; description: string; icon: typeof Sun; currentTheme: string; onSelect: (v: string) => void
}) {
  const isSelected = currentTheme === value
  return (
    <button type="button" onClick={() => onSelect(value)}
      className={`relative flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 w-full ${isSelected ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30' : 'border-border hover:border-teal-300 dark:hover:border-teal-700'}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-teal-500 text-white' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isSelected ? 'text-teal-700 dark:text-teal-300' : ''}`}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {isSelected && <div className="absolute top-3 right-3"><Check className="h-4 w-4 text-teal-500" /></div>}
    </button>
  )
}

function SettingsContent({ serverSettings }: { serverSettings: UserSettings }) {
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState(serverSettings)
  const [hasChanges, setHasChanges] = useState(false)
  if (!mounted) setMounted(true)

  const updateMutation = useMutation({
    mutationFn: (s: UserSettings) =>
      fetch('/api/patient/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }).then((r) => { if (!r.ok) throw new Error(); return r.json() }),
    onSuccess: () => { toast.success('Settings saved successfully'); queryClient.invalidateQueries({ queryKey: ['patient-settings'] }); setHasChanges(false) },
    onError: () => toast.error('Failed to save settings'),
  })

  const handleSettingChange = (key: keyof UserSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value })); setHasChanges(true)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div {...fadeIn} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/patient" className="hover:text-teal-600 transition-colors">Dashboard</Link>
        <span>/</span><span className="text-foreground font-medium">Settings</span>
      </motion.div>
      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences and privacy</p>
          </div>
          {hasChanges && (
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white" onClick={() => updateMutation.mutate(settings)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          )}
        </div>
      </motion.div>
      {/* Appearance */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"><Palette className="h-4 w-4" /></div>
              <div><CardTitle className="text-base">Appearance</CardTitle><CardDescription className="text-xs">Customize how Doctorooms looks on your device</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            {mounted ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {([['light','Light','A clean, bright theme',Sun],['dark','Dark','Easy on the eyes at night',Moon],['system','System','Follow your device setting',Monitor]] as const).map(([v,l,d,i]) => (
                  <ThemeOption key={v} value={v} label={l} description={d} icon={i} currentTheme={theme || 'system'} onSelect={setTheme} />
                ))}
              </div>
            ) : <div className="grid gap-3 sm:grid-cols-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>}
          </CardContent>
        </Card>
      </motion.div>
      {/* Notifications */}
      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"><Bell className="h-4 w-4" /></div>
              <div><CardTitle className="text-base">Notifications</CardTitle><CardDescription className="text-xs">Choose what notifications you want to receive</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {([['emailNotifications','Email Notifications',Mail,'Receive important updates via email','email-notifications'],['bookingReminders','Booking Reminders',CalendarCheck,'Get reminded before your upcoming appointments','booking-reminders'],['marketingEmails','Marketing & Offers',Megaphone,'Receive health tips, offers, and newsletters','marketing-emails']] as const).map(([key,label,Icon,desc,id], i) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div><Label htmlFor={id} className="text-sm font-medium cursor-pointer">{label}</Label><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
                  </div>
                  <Switch id={id} checked={settings[key]} onCheckedChange={(v) => handleSettingChange(key, v)} />
                </div>
                {i < 2 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
      {/* Privacy */}
      <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><Shield className="h-4 w-4" /></div>
              <div><CardTitle className="text-base">Privacy</CardTitle><CardDescription className="text-xs">Control your privacy and data preferences</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-medium">Data & Privacy</h4>
                  <p className="text-xs text-muted-foreground mt-1">Your health records, prescriptions, and personal information are encrypted and stored securely. We never share your medical data with third parties without your consent.</p>
                </div>
              </div>
              <div className="flex gap-2 ml-8">
                <Button variant="outline" size="sm" className="text-xs" asChild><Link href="/dashboard/patient/profile"><ArrowLeft className="h-3 w-3 mr-1" />Manage Profile</Link></Button>
                <Button variant="outline" size="sm" className="text-xs" asChild><Link href="/dashboard/change-password">Change Password</Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* About */}
      <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
        <Card><CardContent className="py-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">Doctorooms</p>
            <p className="text-xs text-muted-foreground">Your Health, Our Priority</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Version 1.0.0 · Built with ❤️</p>
          </div>
        </CardContent></Card>
      </motion.div>
    </div>
  )
}

export default function PatientSettingsPage() {
  const { data, isLoading } = useQuery<{ settings: UserSettings }>({
    queryKey: ['patient-settings'],
    queryFn: () => fetch('/api/patient/settings').then((r) => r.json()),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-6">{Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-5 w-36" /><Skeleton className="h-4 w-56" /></CardHeader>
            <CardContent className="space-y-4">{Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between"><div className="space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div><Skeleton className="h-5 w-9 rounded-full" /></div>
            ))}</CardContent></Card>
        ))}</div>
      </div>
    )
  }

  return <SettingsContent serverSettings={data?.settings ?? { emailNotifications: true, bookingReminders: true, marketingEmails: false }} />
}
