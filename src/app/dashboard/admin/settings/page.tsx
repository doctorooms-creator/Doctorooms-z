'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
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
  Building2,
  MapPin,
  IndianRupee,
  FlaskConical,
  Wifi,
  Volume2,
  MonitorSmartphone,
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
    realtimeEnabled: boolean
    soundEnabled: boolean
    desktopNotifications: boolean
  }
  appearance: {
    primaryColor: string
    darkMode: string
    sidebarPosition: string
  }
  hospitalInfo: {
    hospitalName: string
    hospitalAddress: string
    hospitalPhone: string
    hospitalEmail: string
    hospitalLogo: string
    hospitalGstNo: string
    hospitalRegNo: string
  }
  regional: {
    dateFormat: string
    timeFormat: string
    currencySymbol: string
    country: string
    language: string
  }
  billing: {
    defaultTaxPercent: number
    autoGenerateBillNo: boolean
    billPrefix: string
    showDiscountField: boolean
    paymentTerms: string
  }
  lab: {
    defaultTatHours: number
    autoVerifyNormalResults: boolean
    reportHeaderNote: string
    reportFooterNote: string
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
    realtimeEnabled: true,
    soundEnabled: true,
    desktopNotifications: true,
  },
  appearance: {
    primaryColor: '#0d9488',
    darkMode: 'system',
    sidebarPosition: 'left',
  },
  hospitalInfo: {
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    hospitalEmail: '',
    hospitalLogo: '',
    hospitalGstNo: '',
    hospitalRegNo: '',
  },
  regional: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currencySymbol: '₹',
    country: 'India',
    language: 'en',
  },
  billing: {
    defaultTaxPercent: 0,
    autoGenerateBillNo: true,
    billPrefix: 'BILL-',
    showDiscountField: true,
    paymentTerms: 'Due on Discharge',
  },
  lab: {
    defaultTatHours: 24,
    autoVerifyNormalResults: false,
    reportHeaderNote: '',
    reportFooterNote: '',
  },
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['admin-settings'],
    queryFn: () => fetch('/api/admin/settings').then((r) => r.json()),
    initialData: defaultSettings,
  })

  const [form, setForm] = useState<AppSettings>(defaultSettings)

  // Sync form when data loads
  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        ...settings,
        general: { ...prev.general, ...settings.general },
        appointments: { ...prev.appointments, ...settings.appointments },
        notifications: { ...prev.notifications, ...settings.notifications },
        appearance: { ...prev.appearance, ...settings.appearance },
        hospitalInfo: { ...prev.hospitalInfo, ...(settings.hospitalInfo || {}) },
        regional: { ...prev.regional, ...(settings.regional || {}) },
        billing: { ...prev.billing, ...(settings.billing || {}) },
        lab: { ...prev.lab, ...(settings.lab || {}) },
      }))
    }
  }, [settings])

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

  const handleSave = () => saveMutation.mutate(form)

  const updateSection = <K extends keyof AppSettings>(section: K, key: string, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value } as AppSettings[K],
    }))
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your application configuration</p>
        </div>
        <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full flex-wrap justify-start gap-1 rounded-lg bg-muted p-1">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="hospital" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-3.5 w-3.5" /> Hospital
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Appointments
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 text-xs sm:text-sm">
            <IndianRupee className="h-3.5 w-3.5" /> Billing
          </TabsTrigger>
          <TabsTrigger value="lab" className="gap-1.5 text-xs sm:text-sm">
            <FlaskConical className="h-3.5 w-3.5" /> Lab
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
                    <Label>Site Name</Label>
                    <Input value={form.general.siteName} onChange={(e) => updateSection('general', 'siteName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" value={form.general.email} onChange={(e) => updateSection('general', 'email', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input value={form.general.phone} onChange={(e) => updateSection('general', 'phone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={form.general.timezone} onValueChange={(v) => updateSection('general', 'timezone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map((tz) => (<SelectItem key={tz} value={tz}>{tz}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:max-w-xs">
                    <Label>Currency</Label>
                    <Select value={form.general.currency} onValueChange={(v) => updateSection('general', 'currency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.symbol} ({c.code})</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Hospital Info Tab */}
        <TabsContent value="hospital">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-teal-600" />
                  Hospital Information
                </CardTitle>
                <CardDescription>Default hospital details shown on printouts and reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hospital Name</Label>
                    <Input value={form.hospitalInfo.hospitalName} onChange={(e) => updateSection('hospitalInfo', 'hospitalName', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.hospitalInfo.hospitalPhone} onChange={(e) => updateSection('hospitalInfo', 'hospitalPhone', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.hospitalInfo.hospitalEmail} onChange={(e) => updateSection('hospitalInfo', 'hospitalEmail', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Registration No.</Label>
                    <Input value={form.hospitalInfo.hospitalRegNo} onChange={(e) => updateSection('hospitalInfo', 'hospitalRegNo', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address</Label>
                    <Textarea value={form.hospitalInfo.hospitalAddress} onChange={(e) => updateSection('hospitalInfo', 'hospitalAddress', e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>GST Number</Label>
                    <Input value={form.hospitalInfo.hospitalGstNo} onChange={(e) => updateSection('hospitalInfo', 'hospitalGstNo', e.target.value)} placeholder="e.g. 24AABCU9603R1ZM" />
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
                    <Label>Default Slot Duration (minutes)</Label>
                    <Input type="number" min={5} max={120} value={form.appointments.defaultDuration} onChange={(e) => updateSection('appointments', 'defaultDuration', parseInt(e.target.value) || 30)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Booking Limit</Label>
                    <Input type="number" min={1} max={200} value={form.appointments.dailyLimit} onChange={(e) => updateSection('appointments', 'dailyLimit', parseInt(e.target.value) || 50)} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Approve Appointments</Label>
                    <p className="text-xs text-muted-foreground">Automatically approve new appointments without manual review</p>
                  </div>
                  <Switch checked={form.appointments.autoApprove} onCheckedChange={(checked) => updateSection('appointments', 'autoApprove', checked)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IndianRupee className="h-4 w-4 text-teal-600" />
                  Billing Defaults
                </CardTitle>
                <CardDescription>Default billing configuration for IPD and OPD bills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Tax Percent (%)</Label>
                    <Input type="number" min={0} max={50} step={0.5} value={form.billing.defaultTaxPercent} onChange={(e) => updateSection('billing', 'defaultTaxPercent', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bill Number Prefix</Label>
                    <Input value={form.billing.billPrefix} onChange={(e) => updateSection('billing', 'billPrefix', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value={form.billing.paymentTerms} onValueChange={(v) => updateSection('billing', 'paymentTerms', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Due on Discharge">Due on Discharge</SelectItem>
                        <SelectItem value="Net 15">Net 15 Days</SelectItem>
                        <SelectItem value="Net 30">Net 30 Days</SelectItem>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-generate Bill Numbers</Label>
                      <p className="text-xs text-muted-foreground">Automatically assign sequential bill numbers</p>
                    </div>
                    <Switch checked={form.billing.autoGenerateBillNo} onCheckedChange={(checked) => updateSection('billing', 'autoGenerateBillNo', checked)} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Discount Field</Label>
                      <p className="text-xs text-muted-foreground">Display discount field on bill entry forms</p>
                    </div>
                    <Switch checked={form.billing.showDiscountField} onCheckedChange={(checked) => updateSection('billing', 'showDiscountField', checked)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Lab Tab */}
        <TabsContent value="lab">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4 text-teal-600" />
                  Lab Defaults
                </CardTitle>
                <CardDescription>Configure laboratory report and TAT defaults</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default TAT (hours)</Label>
                    <Input type="number" min={1} max={168} value={form.lab.defaultTatHours} onChange={(e) => updateSection('lab', 'defaultTatHours', parseInt(e.target.value) || 24)} />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-verify Normal Results</Label>
                    <p className="text-xs text-muted-foreground">Automatically verify lab reports where all values are within normal range</p>
                  </div>
                  <Switch checked={form.lab.autoVerifyNormalResults} onCheckedChange={(checked) => updateSection('lab', 'autoVerifyNormalResults', checked)} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Report Header Note</Label>
                  <Textarea value={form.lab.reportHeaderNote} onChange={(e) => updateSection('lab', 'reportHeaderNote', e.target.value)} rows={2} placeholder="Text shown at top of printed lab reports" />
                </div>
                <div className="space-y-2">
                  <Label>Report Footer Note</Label>
                  <Textarea value={form.lab.reportFooterNote} onChange={(e) => updateSection('lab', 'reportFooterNote', e.target.value)} rows={2} placeholder="Text shown at bottom of printed lab reports" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-4 w-4 text-teal-600" />
                  Notification Channels
                </CardTitle>
                <CardDescription>Configure notification delivery methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch checked={form.notifications.emailEnabled} onCheckedChange={(checked) => updateSection('notifications', 'emailEnabled', checked)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch checked={form.notifications.smsEnabled} onCheckedChange={(checked) => updateSection('notifications', 'smsEnabled', checked)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send browser push notifications</p>
                  </div>
                  <Switch checked={form.notifications.pushEnabled} onCheckedChange={(checked) => updateSection('notifications', 'pushEnabled', checked)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wifi className="h-4 w-4 text-teal-600" />
                  Real-time Notifications
                </CardTitle>
                <CardDescription>WebSocket-based instant notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-time Notifications</Label>
                    <p className="text-xs text-muted-foreground">Show instant toasts for admissions, vitals, lab results, bills</p>
                  </div>
                  <Switch checked={form.notifications.realtimeEnabled} onCheckedChange={(checked) => updateSection('notifications', 'realtimeEnabled', checked)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Sound</Label>
                    <p className="text-xs text-muted-foreground">Play a sound when notification arrives</p>
                  </div>
                  <Switch checked={form.notifications.soundEnabled} onCheckedChange={(checked) => updateSection('notifications', 'soundEnabled', checked)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-1.5"><MonitorSmartphone className="h-3.5 w-3.5" /> Desktop Notifications</Label>
                    <p className="text-xs text-muted-foreground">Show system-level desktop notifications</p>
                  </div>
                  <Switch checked={form.notifications.desktopNotifications} onCheckedChange={(checked) => updateSection('notifications', 'desktopNotifications', checked)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Appointment Reminder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs space-y-2">
                  <Label>Reminder Time (before appointment)</Label>
                  <Select value={form.notifications.reminderTime} onValueChange={(v) => updateSection('notifications', 'reminderTime', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                      onClick={() => updateSection('appearance', 'primaryColor', color.primary)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl border-2 p-3 transition-all hover:shadow-md',
                        form.appearance.primaryColor === color.primary ? 'border-teal-500 shadow-sm' : 'border-transparent',
                      )}
                    >
                      <div className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: color.primary }} />
                      <span className="text-sm font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Moon className="h-4 w-4 text-teal-600" /> Theme Mode</CardTitle>
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
                      onClick={() => updateSection('appearance', 'darkMode', mode.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md',
                        form.appearance.darkMode === mode.value ? 'border-teal-500 shadow-sm' : 'border-transparent',
                      )}
                    >
                      <mode.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><AlignLeft className="h-4 w-4 text-teal-600" /> Sidebar Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  {[
                    { value: 'left', label: 'Left', icon: AlignLeft },
                    { value: 'right', label: 'Right', icon: AlignRight },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => updateSection('appearance', 'sidebarPosition', pos.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all hover:shadow-md',
                        form.appearance.sidebarPosition === pos.value ? 'border-teal-500 shadow-sm' : 'border-transparent',
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
