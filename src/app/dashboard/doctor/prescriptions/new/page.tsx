'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pill,
  Save,
  Tag,
  FlaskConical,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AppointmentOption {
  id: string
  appointmentNo: string
  patientName: string
  disease: string
  date: string
  age?: number
  weight?: number
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

interface LabelRow {
  label: string
  value: string
}

export default function NewPrescriptionPage() {
  const router = useRouter()
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [disease, setDisease] = useState('')
  const [weight, setWeight] = useState('')
  const [bp, setBp] = useState('')
  const [temperature, setTemperature] = useState('')
  const [description, setDescription] = useState('')
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { medicine: '', morning: false, afternoon: false, evening: false, tab: 1, dose: '', description: '' },
  ])
  const [labels, setLabels] = useState<LabelRow[]>([])

  // Fetch doctor's medicine master for quick-add
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [medSearch, setMedSearch] = useState('')

  const { data: medMasterData } = useQuery<{ medicines: { id: string; name: string; dose: string; tab: number; morning: string; afternoon: string; evening: string; description: string }[] }>({
    queryKey: ['doctor-medicine-master-quick'],
    queryFn: () => fetch('/api/dashboard/doctor/medicines?status=Active').then((r) => r.json()),
  })

  const filteredMeds = (medMasterData?.medicines || []).filter((m) =>
    m.name.toLowerCase().includes(medSearch.toLowerCase())
  )

  const addFromMaster = (med: typeof filteredMeds[0]) => {
    setMedicines([
      ...medicines,
      {
        medicine: med.name,
        morning: !!med.morning,
        afternoon: !!med.afternoon,
        evening: !!med.evening,
        tab: med.tab || 1,
        dose: med.dose,
        description: med.description,
      },
    ])
    setQuickAddOpen(false)
    setMedSearch('')
    toast.success(`${med.name} added from medicine master`)
  }

  const { data: appointmentsData } = useQuery<{ appointments: AppointmentOption[] }>({
    queryKey: ['doctor-appointments-prescription'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/appointments?status=Approve').then((r) => r.json()),
    enabled: true,
  })

  // Also get Visited appointments
  const { data: visitedData } = useQuery<{ appointments: AppointmentOption[] }>({
    queryKey: ['doctor-visited-appointments'],
    queryFn: () =>
      fetch('/api/dashboard/doctor/appointments?status=Visited').then((r) => r.json()),
    enabled: true,
  })

  const allAppointments = [
    ...(appointmentsData?.appointments || []),
    ...(visitedData?.appointments || []),
  ]

  const handleSelectAppointment = (apptId: string) => {
    setSelectedAppointment(apptId)
    const appt = allAppointments.find((a) => a.id === apptId)
    if (appt) {
      setPatientName(appt.patientName)
      setPatientAge(appt.age?.toString() || '')
      setDisease(appt.disease)
      setWeight(appt.weight?.toString() || '')
    }
  }

  const addMedicine = () => {
    setMedicines([...medicines, { medicine: '', morning: false, afternoon: false, evening: false, tab: 1, dose: '', description: '' }])
  }

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicine = (index: number, field: keyof MedicineRow, value: string | number | boolean) => {
    const updated = [...medicines]
    updated[index] = { ...updated[index], [field]: value }
    setMedicines(updated)
  }

  const addLabel = () => {
    setLabels([...labels, { label: '', value: '' }])
  }

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  const updateLabel = (index: number, field: keyof LabelRow, value: string) => {
    const updated = [...labels]
    updated[index] = { ...updated[index], [field]: value }
    setLabels(updated)
  }

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/dashboard/doctor/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      toast.success('Prescription created successfully')
      router.push(`/dashboard/doctor/prescriptions/${data.prescription?.id}`)
    },
    onError: () => toast.error('Failed to create prescription'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) {
      toast.error('Please select an appointment')
      return
    }
    const validMedicines = medicines.filter((m) => m.medicine.trim())
    if (validMedicines.length === 0) {
      toast.error('Please add at least one medicine')
      return
    }

    createMutation.mutate({
      bookingId: selectedAppointment,
      patientName,
      patientAge,
      disease,
      weight,
      bp,
      temperature,
      description,
      medicines: validMedicines,
      labels: labels.filter((l) => l.label.trim()),
    })
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/doctor/prescriptions" className="text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Prescriptions
        </Link>
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appointment Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedAppointment} onValueChange={handleSelectAppointment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an appointment..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {allAppointments.length === 0 && (
                    <SelectItem value="none" disabled>No approved/visited appointments</SelectItem>
                  )}
                  {allAppointments.map((appt) => (
                    <SelectItem key={appt.id} value={appt.id}>
                      {appt.patientName} — {appt.disease || 'General checkup'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Vitals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patient Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Patient Name</Label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Patient name" />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Age" />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight" />
                </div>
                <div className="space-y-2">
                  <Label>Blood Pressure</Label>
                  <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g. 120/80" />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°F)</Label>
                  <Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="e.g. 98.6" />
                </div>
                <div className="space-y-2">
                  <Label>Disease</Label>
                  <Input value={disease} onChange={(e) => setDisease(e.target.value)} placeholder="Diagnosis" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medicine Builder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Medicines
              </CardTitle>
              <div className="flex gap-2">
                <Popover open={quickAddOpen} onOpenChange={setQuickAddOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950">
                      <FlaskConical className="mr-1 h-3.5 w-3.5" /> Quick Add
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium mb-2">Add from Medicine Master</p>
                      <Input
                        placeholder="Search medicines..."
                        value={medSearch}
                        onChange={(e) => setMedSearch(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="max-h-64">
                      {filteredMeds.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <FlaskConical className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                          {medMasterData?.medicines?.length === 0
                            ? 'No medicines in your master list'
                            : 'No matching medicines'}
                        </div>
                      ) : (
                        <div className="p-1.5">
                          {filteredMeds.map((med) => (
                            <button
                              key={med.id}
                              type="button"
                              onClick={() => addFromMaster(med)}
                              className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent transition-colors group"
                            >
                              <Pill className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{med.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {med.dose || 'No dose'} · {med.tab} tab{med.tab > 1 ? 's' : ''}
                                  {[med.morning && 'M', med.afternoon && 'A', med.evening && 'E'].filter(Boolean).length > 0
                                    ? ` · ${[med.morning && 'Morn', med.afternoon && 'Aftn', med.evening && 'Eve'].filter(Boolean).join('/')}`
                                    : ''}
                                </p>
                              </div>
                              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Blank
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicines.map((med, index) => (
                <div key={index} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Medicine #{index + 1}</span>
                    {medicines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => removeMedicine(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Medicine Name</Label>
                      <Input
                        value={med.medicine}
                        onChange={(e) => updateMedicine(index, 'medicine', e.target.value)}
                        placeholder="Medicine name"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tablets</Label>
                      <Input
                        type="number"
                        min={1}
                        value={med.tab}
                        onChange={(e) => updateMedicine(index, 'tab', parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Dose</Label>
                      <Input
                        value={med.dose}
                        onChange={(e) => updateMedicine(index, 'dose', e.target.value)}
                        placeholder="e.g. 500mg"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={med.morning}
                        onCheckedChange={(checked) => updateMedicine(index, 'morning', !!checked)}
                      />
                      Morning
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={med.afternoon}
                        onCheckedChange={(checked) => updateMedicine(index, 'afternoon', !!checked)}
                      />
                      Afternoon
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={med.evening}
                        onCheckedChange={(checked) => updateMedicine(index, 'evening', !!checked)}
                      />
                      Evening
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={med.description}
                      onChange={(e) => updateMedicine(index, 'description', e.target.value)}
                      placeholder="Additional notes"
                      className="h-9"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Dynamic Labels */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Labels / Lab Results
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLabel}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Label
              </Button>
            </CardHeader>
            <CardContent>
              {labels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No labels added. Add labels like PULSE, BP, etc.
                </p>
              )}
              <div className="space-y-3">
                {labels.map((lbl, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={lbl.label}
                      onChange={(e) => updateLabel(index, 'label', e.target.value)}
                      placeholder="Key (e.g. PULSE)"
                      className="h-9"
                    />
                    <Input
                      value={lbl.value}
                      onChange={(e) => updateLabel(index, 'value', e.target.value)}
                      placeholder="Value (e.g. 70)"
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 shrink-0"
                      onClick={() => removeLabel(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Doctor Notes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Doctor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes, advice, or instructions for the patient..."
                rows={4}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/doctor/prescriptions">Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-700"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Prescription
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}