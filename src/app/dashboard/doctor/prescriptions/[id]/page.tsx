'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Printer,
  Download,
  Pencil,
  Save,
  X,
  User,
  Thermometer,
  Heart,
  Activity,
  Pill,
  FileText,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'
import { PrescriptionPrintView, type PrintData } from '@/components/prescription/print-view'

interface Medicine {
  id: string
  medicine: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  tab: number
  dose: string
  description: string
}

interface LabelItem {
  id: string
  label: string
  value: string
  labelUnit: string
}

interface Prescription {
  id: string
  patientName: string
  patientAge: string
  disease: string
  weight: string
  bp: string
  temperature: string
  description: string
  createdAt: string
  medicines: Medicine[]
  labels: LabelItem[]
  suggestions: { id: string; question: string; suggestions: string }[]
  doctor: {
    id: string
    user: {
      name: string
      profileImg: string
      mobileNo: string
    }
    specialization?: string
    education?: string
    registrationDetail?: string
    city?: string
    state?: string
    address?: string
    hospitalAddress?: string
    phoneNo?: string
    fees?: number
    experience?: string
  }
}

interface MedicineRow {
  medicine: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  tab: number
  dose: string
  description: string
}

interface EditData {
  patientName: string
  patientAge: string
  disease: string
  weight: string
  bp: string
  temperature: string
  description: string
  medicines: MedicineRow[]
  labels: { label: string; value: string }[]
}

const emptyEdit: EditData = {
  patientName: '',
  patientAge: '',
  disease: '',
  weight: '',
  bp: '',
  temperature: '',
  description: '',
  medicines: [],
  labels: [],
}

export default function ViewPrescriptionPage() {
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<EditData | null>(null)
  const [showPrintView, setShowPrintView] = useState(false)

  const { data, isLoading } = useQuery<{ prescription: Prescription }>({
    queryKey: ['doctor-prescription', id],
    queryFn: () => fetch(`/api/dashboard/doctor/prescriptions/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch(`/api/dashboard/doctor/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescription', id] })
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] })
      toast.success('Prescription updated')
      setIsEditing(false)
      setEditData(null)
    },
    onError: () => toast.error('Failed to update prescription'),
  })

  const rx = data?.prescription
  const display = editData ?? rx

  const startEditing = () => {
    if (!rx) return
    setEditData({
      patientName: rx.patientName,
      patientAge: rx.patientAge,
      disease: rx.disease,
      weight: rx.weight,
      bp: rx.bp,
      temperature: rx.temperature,
      description: rx.description,
      medicines: rx.medicines.map((m) => ({
        medicine: m.medicine,
        morning: m.morning,
        afternoon: m.afternoon,
        evening: m.evening,
        tab: m.tab,
        dose: m.dose,
        description: m.description,
      })),
      labels: rx.labels.map((l) => ({ label: l.label, value: l.value })),
    })
    setIsEditing(true)
  }

  const { data: printData } = useQuery<PrintData>({
    queryKey: ['rx-print-data', id],
    queryFn: () => fetch(`/api/prescription/${id}/print`).then((r) => r.json()),
    enabled: showPrintView && !!id,
  })

  const handlePrint = () => {
    setShowPrintView(true)
  }

  const handlePrintAction = () => window.print()

  const handleClosePrint = () => setShowPrintView(false)

  const handleDownloadPdf = () => {
    if (!rx) return
    setShowPrintView(true)
    setTimeout(() => window.print(), 200)
  }

  const handleSave = () => {
    if (!editData) return
    const validMedicines = editData.medicines.filter((m) => m.medicine.trim())
    if (validMedicines.length === 0) {
      toast.error('Add at least one medicine')
      return
    }
    updateMutation.mutate({
      ...editData,
      medicines: validMedicines,
      labels: editData.labels.filter((l) => l.label.trim()),
    })
  }

  const updateMed = (index: number, field: string, value: string | number | boolean) => {
    setEditData((prev) => {
      if (!prev) return prev
      const updated = [...prev.medicines]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, medicines: updated }
    })
  }

  const addMed = () => {
    setEditData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        medicines: [...prev.medicines, { medicine: '', morning: false, afternoon: false, evening: false, tab: 1, dose: '', description: '' }],
      }
    })
  }

  const removeMed = (index: number) => {
    setEditData((prev) => {
      if (!prev) return prev
      return { ...prev, medicines: prev.medicines.filter((_, i) => i !== index) }
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border border-border p-6 space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!rx) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-40" />
        <p className="font-medium">Prescription not found</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/dashboard/doctor/prescriptions">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Prescriptions
          </Link>
        </Button>
      </div>
    )
  }

  const displayMeds = isEditing && editData ? editData.medicines : rx.medicines

  // Print preview overlay
  if (showPrintView && printData) {
    return (
      <PrescriptionPrintView
        data={printData}
        onClose={handleClosePrint}
        onPrint={handlePrintAction}
      />
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Actions - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/doctor/prescriptions" className="text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="mr-1 h-4 w-4" /> Download PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Prescription Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="print:shadow-none print:border-0">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg print:text-xl">Prescription</CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(rx.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">Dr. {rx.doctor?.user?.name || 'Doctor'}</p>
                {rx.doctor?.user?.mobileNo && (
                  <p className="text-muted-foreground">{rx.doctor.user.mobileNo}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Info */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Patient Information
              </h3>
              {isEditing && editData ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={editData.patientName} onChange={(e) => setEditData({ ...editData, patientName: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Age</label>
                    <Input value={editData.patientAge} onChange={(e) => setEditData({ ...editData, patientAge: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Disease</label>
                    <Input value={editData.disease} onChange={(e) => setEditData({ ...editData, disease: e.target.value })} className="h-9" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Name" value={rx.patientName} />
                  <InfoItem label="Age" value={rx.patientAge || '—'} />
                  <InfoItem label="Disease" value={rx.disease || '—'} />
                </div>
              )}
            </div>

            {/* Vitals */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Vitals
              </h3>
              {isEditing && editData ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Weight (kg)</label>
                    <Input value={editData.weight} onChange={(e) => setEditData({ ...editData, weight: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">BP</label>
                    <Input value={editData.bp} onChange={(e) => setEditData({ ...editData, bp: e.target.value })} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Temperature (°F)</label>
                    <Input value={editData.temperature} onChange={(e) => setEditData({ ...editData, temperature: e.target.value })} className="h-9" />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoItem icon={<Heart className="h-3.5 w-3.5" />} label="Weight" value={rx.weight ? `${rx.weight} kg` : '—'} />
                  <InfoItem icon={<Activity className="h-3.5 w-3.5" />} label="BP" value={rx.bp || '—'} />
                  <InfoItem icon={<Thermometer className="h-3.5 w-3.5" />} label="Temperature" value={rx.temperature ? `${rx.temperature}°F` : '—'} />
                </div>
              )}
            </div>

            {/* Labels */}
            {rx.labels.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold mb-3">Labels / Lab Results</h3>
                <div className="flex flex-wrap gap-2">
                  {rx.labels.map((l) => (
                    <Badge key={l.id} variant="secondary" className="text-xs">
                      {l.label}: {l.value} {l.labelUnit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Medicines */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" /> Medicines
                </h3>
                {isEditing && (
                  <Button type="button" variant="outline" size="sm" onClick={addMed}>
                    + Add
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">Medicine</th>
                      <th className="pb-2 text-center font-medium text-muted-foreground">M</th>
                      <th className="pb-2 text-center font-medium text-muted-foreground">A</th>
                      <th className="pb-2 text-center font-medium text-muted-foreground">E</th>
                      <th className="pb-2 text-center font-medium text-muted-foreground">Tab</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Dose</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Notes</th>
                      {isEditing && <th className="pb-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayMeds.map((med, i) => (
                      <tr key={isEditing ? `edit-${i}` : (med as Medicine).id || i} className="border-b border-border/50">
                        <td className="py-2.5">
                          {isEditing ? (
                            <Input
                              value={med.medicine}
                              onChange={(e) => updateMed(i, 'medicine', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Medicine"
                            />
                          ) : (
                            <span className="font-medium">{med.medicine}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {isEditing ? (
                            <input type="checkbox" checked={med.morning} onChange={(e) => updateMed(i, 'morning', e.target.checked)} className="h-4 w-4 rounded" />
                          ) : (
                            med.morning && <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400 text-[10px] px-1.5">M</Badge>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {isEditing ? (
                            <input type="checkbox" checked={med.afternoon} onChange={(e) => updateMed(i, 'afternoon', e.target.checked)} className="h-4 w-4 rounded" />
                          ) : (
                            med.afternoon && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-[10px] px-1.5">A</Badge>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {isEditing ? (
                            <input type="checkbox" checked={med.evening} onChange={(e) => updateMed(i, 'evening', e.target.checked)} className="h-4 w-4 rounded" />
                          ) : (
                            med.evening && <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400 text-[10px] px-1.5">E</Badge>
                          )}
                        </td>
                        <td className="py-2.5 text-center">{med.tab}</td>
                        <td className="py-2.5 text-muted-foreground">{med.dose || '—'}</td>
                        <td className="py-2.5 text-muted-foreground text-xs">{med.description || '—'}</td>
                        {isEditing && (
                          <td className="py-2.5">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeMed(i)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {displayMeds.length === 0 && !isEditing && (
                <p className="text-sm text-muted-foreground text-center py-4">No medicines listed</p>
              )}
            </div>

            {/* Description / Notes */}
            {(rx.description || isEditing) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-2">Doctor&apos;s Notes</h3>
                  {isEditing && editData ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                      placeholder="Doctor notes..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rx.description || 'No notes'}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground pt-0.5">{icon}{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
