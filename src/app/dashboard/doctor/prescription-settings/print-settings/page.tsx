'use client'

import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Printer, Save, Loader2, ImageIcon, Type, Layout, ToggleLeft, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PrintSettings {
  id: string
  logo: string
  header: string
  fullHeader: string
  isFullHeader: boolean
  footer: string
  showCoInPrint: boolean
  showNextVisit: boolean
  printLayout: string
  createdAt: string
  updatedAt: string
}

const defaultSettings: PrintSettings = {
  id: '',
  logo: '',
  header: '',
  fullHeader: '',
  isFullHeader: false,
  footer: '',
  showCoInPrint: true,
  showNextVisit: true,
  printLayout: 'standard',
  createdAt: '',
  updatedAt: '',
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function PrintSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settingsData, isLoading } = useQuery<{ settings: PrintSettings }>({
    queryKey: ['print-settings'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/prescription-settings/print-settings').then((r) => r.json()),
    staleTime: 30_000,
  })

  const fetchedSettings = settingsData?.settings || defaultSettings

  const savedRef = useRef<PrintSettings>(defaultSettings)
  const [form, setForm] = useState<PrintSettings>(defaultSettings)

  // One-time sync from server to local form (render-phase, no effect)
  const prevIdRef = useRef('')
  if (fetchedSettings.id && fetchedSettings.id !== prevIdRef.current) {
    prevIdRef.current = fetchedSettings.id
    savedRef.current = fetchedSettings
    setForm(fetchedSettings)
  }

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/dashboard/doctor/prescription-settings/print-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (res: Record<string, unknown>) => {
      if (res.error) {
        toast.error(res.error as string)
        return
      }
      const updated = res.settings as PrintSettings
      toast.success('Print settings saved')
      queryClient.setQueryData(['print-settings'], res)
      savedRef.current = updated
      setForm(updated)
    },
    onError: () => {
      toast.error('Failed to save print settings')
    },
  })

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      logo: form.logo,
      header: form.header,
      fullHeader: form.fullHeader,
      isFullHeader: form.isFullHeader,
      footer: form.footer,
      showCoInPrint: form.showCoInPrint,
      showNextVisit: form.showNextVisit,
      printLayout: form.printLayout,
    })
  }, [form, saveMutation])

  const hasChanges =
    (form.logo !== savedRef.current.logo ||
      form.header !== savedRef.current.header ||
      form.fullHeader !== savedRef.current.fullHeader ||
      form.isFullHeader !== savedRef.current.isFullHeader ||
      form.footer !== savedRef.current.footer ||
      form.showCoInPrint !== savedRef.current.showCoInPrint ||
      form.showNextVisit !== savedRef.current.showNextVisit ||
      form.printLayout !== savedRef.current.printLayout)

  const update = (key: keyof PrintSettings, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  /* ---- Section wrapper ---- */
  const sectionCls = 'rounded-xl border bg-card p-5 md:p-6'
  const sectionHeaderCls = 'flex items-center justify-center h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/30'
  const iconCls = 'h-4 w-4 text-teal-600 dark:text-teal-400'

  /* ---- Render ---- */
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Printer className="h-6 w-6 text-teal-600" />
          Print Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your prescription printout appearance and options.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ===== HEADER SECTION ===== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={sectionCls}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={sectionHeaderCls}>
                <Type className={iconCls} />
              </div>
              <h2 className="font-semibold text-lg">Header</h2>
            </div>

            {/* isFullHeader toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 gap-3 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <ImageIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm font-medium">Use Full Header Image</Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, a single image replaces the logo + text header on printouts.
                  </p>
                </div>
              </div>
              <Switch
                checked={form.isFullHeader}
                onCheckedChange={(v) => update('isFullHeader', v)}
              />
            </div>

            <div className="space-y-4">
              {form.isFullHeader ? (
                <div className="space-y-2">
                  <Label htmlFor="fullHeader" className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Full Header Image URL
                  </Label>
                  <Input
                    id="fullHeader"
                    placeholder="https://example.com/clinic-header.png"
                    value={form.fullHeader}
                    onChange={(e) => update('fullHeader', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This image will span the full width of the print header.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo" className="flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      Logo URL
                    </Label>
                    <Input
                      id="logo"
                      placeholder="https://example.com/clinic-logo.png"
                      value={form.logo}
                      onChange={(e) => update('logo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header" className="flex items-center gap-1.5">
                      <Type className="h-3.5 w-3.5 text-muted-foreground" />
                      Header Text
                    </Label>
                    <Textarea
                      id="header"
                      placeholder={'Dr. John Smith, MBBS, MD\nSpecialization: Cardiology\nAddress: 123 Health St, City\nPhone: +91 98765 43210\nReg No: MC-12345'}
                      value={form.header}
                      onChange={(e) => update('header', e.target.value)}
                      rows={5}
                      className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed below the logo on the printout. Supports multiple lines.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ===== FOOTER SECTION ===== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={sectionCls}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={sectionHeaderCls}>
                <Type className={iconCls} />
              </div>
              <h2 className="font-semibold text-lg">Footer</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="footer">Footer Text</Label>
              <Textarea
                id="footer"
                placeholder="Thank you for visiting. Follow up as advised."
                value={form.footer}
                onChange={(e) => update('footer', e.target.value)}
                rows={3}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Displayed at the bottom of the prescription printout.
              </p>
            </div>
          </motion.div>

          {/* ===== PRINT OPTIONS SECTION ===== */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={sectionCls}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className={sectionHeaderCls}>
                <Layout className={iconCls} />
              </div>
              <h2 className="font-semibold text-lg">Print Options</h2>
            </div>

            <div className="space-y-3">
              {/* Show C/O toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <ToggleLeft className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm font-medium">Show C/O in Print</Label>
                    <p className="text-xs text-muted-foreground">
                      Display the Chief Complaints section on printed prescriptions.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.showCoInPrint}
                  onCheckedChange={(v) => update('showCoInPrint', v)}
                />
              </div>

              {/* Show Next Visit toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3 gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <Label className="text-sm font-medium">Show Next Visit Date</Label>
                    <p className="text-xs text-muted-foreground">
                      Display the next visit date on printed prescriptions.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.showNextVisit}
                  onCheckedChange={(v) => update('showNextVisit', v)}
                />
              </div>

              <Separator />

              {/* Print layout dropdown */}
              <div className="space-y-2">
                <Label htmlFor="printLayout" className="flex items-center gap-1.5">
                  <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                  Print Layout
                </Label>
                <Select
                  value={form.printLayout}
                  onValueChange={(v) => update('printLayout', v)}
                >
                  <SelectTrigger id="printLayout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Standard: balanced layout. Compact: smaller fonts, more content. Detailed: extra spacing and larger text.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ===== SAVE BUTTON ===== */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {hasChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !hasChanges}
              className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
