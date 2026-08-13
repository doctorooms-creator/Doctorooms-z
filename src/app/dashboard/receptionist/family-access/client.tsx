'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Plus,
  Copy,
  ShieldOff,
  Link as LinkIcon,
  Check,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { toast } from 'sonner'

interface Admission {
  id: string
  admissionNo: string
  patientName: string
  status: string
  ward?: { name: string }
  bed?: { bedNumber: string }
}

interface FamilyAccessItem {
  id: string
  admissionId: string
  accessCode: string
  patientName: string
  relationName: string
  relationMobile: string
  isActive: boolean
  canViewVitals: boolean
  canViewDiet: boolean
  canViewBill: boolean
  createdAt: string
  admission: {
    admissionNo: string
    status: string
  }
}

export default function FamilyAccessClient() {
  const queryClient = useQueryClient()
  const [showGenerate, setShowGenerate] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<FamilyAccessItem | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Form state
  const [formAdmissionId, setFormAdmissionId] = useState('')
  const [formRelationName, setFormRelationName] = useState('')
  const [formRelationMobile, setFormRelationMobile] = useState('')
  const [formCanViewVitals, setFormCanViewVitals] = useState(true)
  const [formCanViewDiet, setFormCanViewDiet] = useState(true)
  const [formCanViewBill, setFormCanViewBill] = useState(true)

  // Fetch admissions for dropdown
  const { data: admissions = [] } = useQuery<Admission[]>({
    queryKey: ['ipd-admissions-admitted'],
    queryFn: () => fetch('/api/dashboard/receptionist/ipd?status=Admitted&limit=200').then(r => r.json()).then(d => d.admissions || []),
  })

  // Fetch family access list
  const { data: accessList = [], isLoading } = useQuery<FamilyAccessItem[]>({
    queryKey: ['family-access-list'],
    queryFn: () => fetch('/api/family-access').then(r => r.json()),
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/family-access/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: formAdmissionId,
          relationName: formRelationName,
          relationMobile: formRelationMobile,
          canViewVitals: formCanViewVitals,
          canViewDiet: formCanViewDiet,
          canViewBill: formCanViewBill,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`Access code generated: ${data.accessCode}`, {
        description: 'Share the link with the family member',
        duration: 5000,
      })
      setShowGenerate(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['family-access-list'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Revoke mutation
  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/family-access/${id}/revoke`, { method: 'PUT' })
      if (!res.ok) throw new Error('Failed to revoke')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Access code revoked')
      setRevokeTarget(null)
      queryClient.invalidateQueries({ queryKey: ['family-access-list'] })
    },
    onError: () => toast.error('Failed to revoke'),
  })

  const resetForm = () => {
    setFormAdmissionId('')
    setFormRelationName('')
    setFormRelationMobile('')
    setFormCanViewVitals(true)
    setFormCanViewDiet(true)
    setFormCanViewBill(true)
  }

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
    if (type === 'code') {
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } else {
      setCopiedLink(text)
      setTimeout(() => setCopiedLink(null), 2000)
    }
  }

  const activeCount = accessList.filter(a => a.isActive).length
  const revokedCount = accessList.filter(a => !a.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600" />
            Family Access
          </h2>
          <p className="text-sm text-muted-foreground">Generate access codes for patient families</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['family-access-list'] })}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" size="sm" onClick={() => setShowGenerate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Code
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2.5 dark:bg-teal-950">
              <UserCheck className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Codes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
              <UserX className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{revokedCount}</p>
              <p className="text-xs text-muted-foreground">Revoked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-950">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{accessList.length}</p>
              <p className="text-xs text-muted-foreground">Total Generated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Family Access Codes</CardTitle>
          <CardDescription>Manage access codes for patient family members</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : accessList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No family access codes generated yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click &quot;Generate Code&quot; to create one</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Access Code</TableHead>
                    <TableHead className="hidden md:table-cell">Relation</TableHead>
                    <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {accessList.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{item.patientName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs text-violet-600 border-violet-300 dark:text-violet-400 dark:border-violet-700">
                            {item.admission?.admissionNo || '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-bold tracking-wider">
                              {item.isActive ? item.accessCode : '••••••'}
                            </code>
                            {item.isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyToClipboard(item.accessCode, 'code')}
                              >
                                {copiedCode === item.accessCode ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{item.relationName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{item.relationMobile}</TableCell>
                        <TableCell>
                          {item.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-slate-500">
                              Revoked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => copyToClipboard(`/family/${item.accessCode}`, 'link')}
                              >
                                {copiedLink === `/family/${item.accessCode}` ? (
                                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <LinkIcon className="mr-1 h-3.5 w-3.5" />
                                )}
                                Copy Link
                              </Button>
                            )}
                            {item.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => setRevokeTarget(item)}
                              >
                                <ShieldOff className="mr-1 h-3.5 w-3.5" />
                                Revoke
                              </Button>
                            )}
                          </div>
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

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={(open) => { setShowGenerate(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              Generate Family Access Code
            </DialogTitle>
            <DialogDescription>
              Create a secure access code for a patient&apos;s family member to view real-time updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Admission Select */}
            <div className="space-y-2">
              <Label>Admitted Patient *</Label>
              <Select value={formAdmissionId} onValueChange={setFormAdmissionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select admitted patient" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {admissions.map((adm) => (
                    <SelectItem key={adm.id} value={adm.id}>
                      {adm.patientName} — {adm.admissionNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Relation Name */}
            <div className="space-y-2">
              <Label>Relation Name *</Label>
              <Input
                placeholder="e.g. Rajesh Kumar (Father)"
                value={formRelationName}
                onChange={(e) => setFormRelationName(e.target.value)}
              />
            </div>

            {/* Relation Mobile */}
            <div className="space-y-2">
              <Label>Relation Mobile *</Label>
              <Input
                placeholder="e.g. +91 98765 43210"
                value={formRelationMobile}
                onChange={(e) => setFormRelationMobile(e.target.value)}
              />
            </div>

            {/* Permission Toggles */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Access Permissions</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">View Vitals</p>
                  <p className="text-xs text-muted-foreground">Temperature, BP, Pulse, SpO2</p>
                </div>
                <Switch checked={formCanViewVitals} onCheckedChange={setFormCanViewVitals} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">View Diet Orders</p>
                  <p className="text-xs text-muted-foreground">Current diet plan and meals</p>
                </div>
                <Switch checked={formCanViewDiet} onCheckedChange={setFormCanViewDiet} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">View Bill Summary</p>
                  <p className="text-xs text-muted-foreground">Current bill amount and charges</p>
                </div>
                <Switch checked={formCanViewBill} onCheckedChange={setFormCanViewBill} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGenerate(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!formAdmissionId || !formRelationName || !formRelationMobile || generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access for <strong>{revokeTarget?.relationName}</strong> viewing{' '}
              <strong>{revokeTarget?.patientName}</strong>&apos;s information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
            >
              {revokeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
