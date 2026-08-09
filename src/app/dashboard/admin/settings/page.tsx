'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Globe,
  CalendarDays,
  Bell,
  Palette,
  Save,
  Loader2,
  Moon,
  Sun,
  Monitor,
  AlignLeft,
  AlignRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const COLOR_PRESETS = [
  { name: 'Teal', primary: '#0d9488', light: '#ccfbf1' },
  { name: 'Blue', primary: '#2563eb', light: '#dbeafe' },
  { name: 'Violet', primary: '#7c3aed', light: '#ede9fe' },
  { name: 'Rose', primary: '#e11d48', light: '#ffe4e6' },
  { name: 'Amber', primary: '#d97706', light: '#fef3c7' },
  { name: 'Emerald', primary: '#059669', light: '#d1fae5' },
]

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
]

const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
]

interface AppSettings {
  general: {
    siteName: string
    email: string
    phone: string
    timezone: string
    currency: string
  }
  appointments: {
    defaultDuration: number
    dailyLimit: number
    autoApprove: boolean
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    reminderTime: string
  }
  appearance: {
    primaryColor: string
    darkMode: string
    sidebarPosition: string
  }
}

const defaultSettings: AppSettings = {
  general: {
    siteName: 'Doctorooms',
    email: 'admin@doctorooms.com',
    phone: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  },
  appointments: {
    defaultDuration: 30,
    dailyLimit: 50,
    autoApprove: false,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    reminderTime: '30',
  },
  appearance: {
    primaryColor: '#0d9488',
    darkMode: 'system',
    sidebarPosition: 'left',
  },
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => fetch('/api/admin/settings').then((r) => r.json()),
    initialData: defaultSettings,
  })

  const [form, setForm] = useState<AppSettings>(settings || defaultSettings)

  const saveMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const handleSave = () => {
    saveMutation.mutate(form)
  }

  const updateGeneral = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, general: { ...prev.general, [key]: value } }))
  }

  const updateAppointments = (key: string, value: boolean | number) => {
    setForm((prev) => ({ ...prev, appointments: { ...prev.appointments, [key]: value } }))
  }

  const updateNotifications = (key: string, value: boolean | string) => {
    setForm((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }))
  }

  const updateAppearance = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, appearance: { ...prev.appearance, [key]: value } }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-60 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your application configuration</p>
        </div>
        <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </motion.div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full justify-start gap-1 rounded-lg bg-muted p-1 sm:w-auto">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Appointments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-3.5 w-3.5" /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4 text-teal-600" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic site configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input
                      id="site-name"
                      value={form.general.siteName}
                      onChange={(e) => updateGeneral('siteName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-email">Contact Email</Label>
                    <Input
                      id="site-email"
                      type="email"
                      value={form.general.email}
                      onChange={(e) => updateGeneral('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-phone">Contact Phone</Label>
                    <Input
                      id="site-phone"
                      value={form.general.phone}
                      onChange={(e) => updateGeneral('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={form.general.timezone} onValueChange={(v) => updateGeneral('timezone', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2 sm:max-w-xs">
                    <Label>Currency</Label>
                    <Select value={form.general.currency} onValueChange={(v) => updateGeneral('currency', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-teal-600" />
                  Appointment Settings
                </CardTitle>
                <CardDescription>Configure default appointment behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-duration">Default Slot Duration (minutes)</Label>
                    <Input
                      id="default-duration"
                      type="number"
                      min={5}
                      max={120}
                      value={form.appointments.defaultDuration}
                      onChange={(e) => updateAppointments('defaultDuration', parseInt(e.target.value) || 30)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily-limit">Daily Booking Limit</Label>
                    <Input
                      id="daily-limit"
                      type="number"
                      min={1}
                      max={200}
                      value={form.appointments.dailyLimit}
                      onChange={(e) => updateAppointments('dailyLimit', parseInt(e.target.value) || 50)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Appointments</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically approve new appointments without manual review
                    </p>
                  </div>
                  <Switch
                    checked={form.appointments.autoApprove}
                    onCheckedChange={(checked) => updateAppointments('autoApprove', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-teal-600" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure notification channels and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      checked={form.notifications.emailEnabled}
                      onCheckedChange={(checked) => updateNotifications('emailEnabled', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-xs text-muted-foreground">Send notifications via SMS</p>
                    </div>
                    <Switch
                      checked={form.notifications.smsEnabled}
                      onCheckedChange={(checked) => updateNotifications('smsEnabled', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Send browser push notifications</p>
                    </div>
                    <Switch
                      checked={form.notifications.pushEnabled}
                      onCheckedChange={(checked) => updateNotifications('pushEnabled', checked)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="max-w-xs space-y-2">
                  <Label>Reminder Time (before appointment)</Label>
                  <Select value={form.notifications.reminderTime} onValueChange={(v) => updateNotifications('reminderTime', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="120">2 hours before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Color swatches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-teal-600" />
                  Primary Color
                </CardTitle>
                <CardDescription>Choose the primary color for the application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => updateAppearance('primaryColor', color.primary)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border-2 p-3 transition-all hover:shadow-md',
                        form.appearance.primaryColor === color.primary
                          ? 'border-teal-500 shadow-sm'
                          : 'border-transparent'
                      )}
                    >
                      <div
                        className="h-8 w-8 rounded-full shadow-inner"
                        style={{ backgroundColor: color.primary }}
                      />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dark mode */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Moon className="h-4 w-4 text-teal-600" />
                  Theme Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => updateAppearance('darkMode', mode.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md',
                        form.appearance.darkMode === mode.value
                          ? 'border-teal-500 shadow-sm'
                          : 'border-transparent'
                      )}
                    >
                      <mode.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlignLeft className="h-4 w-4 text-teal-600" />
                  Sidebar Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {[
                    { value: 'left', label: 'Left', icon: AlignLeft },
                    { value: 'right', label: 'Right', icon: AlignRight },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => updateAppearance('sidebarPosition', pos.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md',
                        form.appearance.sidebarPosition === pos.value
                          ? 'border-teal-500 shadow-sm'
                          : 'border-transparent'
                      )}
                    >
                      <pos.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{pos.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
