'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  Heart,
  FileText,
  Activity,
  Clock,
  Dumbbell,
  Thermometer,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Droplets,
  Stethoscope,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

// ---------- Types ----------

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

interface SuggestionItem {
  id: string
  question: string
  suggestions: string
}

interface Prescription {
  id: string
  disease: string
  weight: string
  bp: string
  temperature: string
  description: string
  createdAt: string
  medicines: Medicine[]
  labels: LabelItem[]
  suggestions: SuggestionItem[]
}

interface Visit {
  id: string
  appointmentNo: string
  bookingDate: string
  disease: string
  description: string
  status: string
  timeSlot: string
  bookingMode: string
  bloodGroup: string
  weight: number
  height: number
  prescriptions: Prescription[]
}

interface PatientInfo {
  name: string
  gender: string
  email: string
  mobileNo: string
  profileImg: string
  dateOfBirth: string | null
  createdAt: string
  age: number | null
  bloodGroup: string
}

interface Stats {
  totalVisits: number
  lastVisit: string | null
  commonDiseases: { disease: string; count: number }[]
}

interface PatientDetailData {
  patient: PatientInfo
  visitHistory: Visit[]
  stats: Stats
}

// ---------- Status Config ----------

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  Pending: { label: 'Pending', variant: 'outline', className: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:bg-yellow-950/30' },
  Approve: { label: 'Approved', variant: 'outline', className: 'border-teal-300 text-teal-700 bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:bg-teal-950/30' },
  Visited: { label: 'Visited', variant: 'default', className: 'bg-teal-600 text-white hover:bg-teal-600' },
  Finish: { label: 'Completed', variant: 'default', className: 'bg-teal-600 text-white hover:bg-teal-600' },
  Canceled: { label: 'Canceled', variant: 'destructive', className: 'bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' },
  Extend: { label: 'Extended', variant: 'outline', className: 'border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950/30' },
}

// ---------- Animation Variants ----------

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

// ---------- Component ----------

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<PatientDetailData>({
    queryKey: ['doctor-patient-detail', patientId],
    queryFn: () => fetch(`/api/dashboard/doctor/patients/${patientId}`).then((r) => {
      if (!r.ok) throw new Error('Failed to load')
      return r.json()
    }),
    enabled: !!patientId,
  })

  const patient = data?.patient
  const visits = data?.visitHistory || []
  const stats = data?.stats

  // Vitals timeline data (visits with weight or BP)
  const vitalsData = visits.filter((v) => v.weight > 0 || v.prescriptions.some((p) => p.bp))

  // All unique prescriptions across visits
  const allPrescriptions = visits.flatMap((v) => v.prescriptions)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <User className="h-14 w-14 mb-4 opacity-30" />
        <p className="font-medium text-lg">Patient not found</p>
        <p className="text-sm mt-1">The patient you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <Button variant="ghost" className="mt-6" onClick={() => router.push('/dashboard/doctor/patients')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Patients
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <motion.div {...fadeInUp}>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
          <Link href="/dashboard/doctor/patients">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Patients
          </Link>
        </Button>
      </motion.div>

      {/* Patient Header Card */}
      <motion.div {...fadeInUp} transition={{ duration: 0.35, delay: 0.05 }}>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 h-2" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <Avatar className="h-20 w-20 border-2 border-teal-200 dark:border-teal-800 shrink-0">
                <AvatarImage src={patient.profileImg || ''} />
                <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-2xl">
                  {patient.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">{patient.name}</h1>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {patient.gender && (
                        <Badge variant="secondary" className="text-xs">
                          <User className="mr-1 h-3 w-3" /> {patient.gender}
                        </Badge>
                      )}
                      {patient.age && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="mr-1 h-3 w-3" /> {patient.age} yrs
                        </Badge>
                      )}
                      {patient.bloodGroup && (
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                          <Droplets className="mr-1 h-3 w-3" /> {patient.bloodGroup}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {patient.mobileNo && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {patient.mobileNo}
                    </span>
                  )}
                  {patient.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {patient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div {...fadeInUp}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Visits</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats?.totalVisits || 0}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeInUp}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Last Visit</p>
                <p className="text-sm font-semibold">
                  {stats?.lastVisit
                    ? format(parseISO(stats.lastVisit), 'MMM d, yyyy')
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeInUp}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Member Since</p>
                <p className="text-sm font-semibold">
                  {format(parseISO(patient.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Common Diseases */}
      {stats?.commonDiseases && stats.commonDiseases.length > 0 && (
        <motion.div {...fadeInUp} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Frequent Conditions
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.commonDiseases.map((cd) => (
                  <Badge key={cd.disease} variant="secondary" className="text-xs py-1 px-3">
                    {cd.disease}
                    <span className="ml-1.5 text-muted-foreground">({cd.count})</span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs: Visit History, Prescriptions, Vitals Timeline */}
      <motion.div {...fadeInUp} transition={{ duration: 0.35, delay: 0.25 }}>
        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="visits" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Visits
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Prescriptions
              {allPrescriptions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                  {allPrescriptions.length}
                </Badge>
              )}
            </TabsTrigger>
            {vitalsData.length > 0 && (
              <TabsTrigger value="vitals" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" /> Vitals
              </TabsTrigger>
            )}
          </TabsList>

          {/* Visit History Tab */}
          <TabsContent value="visits" className="mt-4">
            {visits.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-12 w-12" />}
                title="No visits yet"
                description="This patient has no recorded visits with you."
              />
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {visits.map((visit, i) => {
                  const isExpanded = expandedVisit === visit.id
                  const sc = statusConfig[visit.status] || statusConfig.Pending
                  const rx = visit.prescriptions[0]

                  return (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className={cn(
                        'transition-all hover:shadow-sm',
                        isExpanded && 'border-teal-300 dark:border-teal-700'
                      )}>
                        <button
                          className="w-full text-left p-4 flex items-start justify-between gap-3"
                          onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">
                                {format(parseISO(visit.bookingDate), 'MMM d, yyyy')}
                              </span>
                              {visit.timeSlot && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {visit.timeSlot}
                                </span>
                              )}
                              <Badge variant={sc.variant} className={cn('text-[10px] px-1.5 py-0', sc.className)}>
                                {sc.label}
                              </Badge>
                              {visit.bookingMode === 'VideoCall' && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  Video
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>#{visit.appointmentNo}</span>
                              {visit.disease && (
                                <span className="text-foreground/80 font-medium">{visit.disease}</span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 pt-0.5">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <Separator className="mx-4" />
                              <div className="p-4 space-y-4">
                                {/* Description */}
                                {visit.description && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm whitespace-pre-wrap">{visit.description}</p>
                                  </div>
                                )}

                                {/* Vitals */}
                                {(visit.weight > 0 || visit.height > 0 || rx?.bp || rx?.temperature) && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                      <Activity className="h-3.5 w-3.5" /> Vitals
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                      {visit.weight > 0 && (
                                        <VitalPill icon={<Dumbbell className="h-3.5 w-3.5" />} label="Weight" value={`${visit.weight} kg`} color="text-teal-600 dark:text-teal-400" />
                                      )}
                                      {visit.height > 0 && (
                                        <VitalPill icon={<Activity className="h-3.5 w-3.5" />} label="Height" value={`${visit.height} cm`} color="text-blue-600 dark:text-blue-400" />
                                      )}
                                      {rx?.bp && (
                                        <VitalPill icon={<Heart className="h-3.5 w-3.5" />} label="BP" value={rx.bp} color="text-red-600 dark:text-red-400" />
                                      )}
                                      {rx?.temperature && (
                                        <VitalPill icon={<Thermometer className="h-3.5 w-3.5" />} label="Temp" value={`${rx.temperature}°F`} color="text-orange-600 dark:text-orange-400" />
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Prescription Summary */}
                                {rx && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" /> Prescription
                                      </p>
                                      <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300" asChild>
                                        <Link href={`/dashboard/doctor/prescriptions/${rx.id}`}>
                                          View Full <ExternalLink className="h-3 w-3" />
                                        </Link>
                                      </Button>
                                    </div>
                                    {rx.medicines.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {rx.medicines.slice(0, 3).map((med) => (
                                          <Badge key={med.id} variant="secondary" className="text-[11px]">
                                            {med.medicine}
                                            <span className="ml-1 text-muted-foreground">
                                              {med.morning ? 'M' : ''}{med.afternoon ? 'A' : ''}{med.evening ? 'E' : ''}
                                            </span>
                                          </Badge>
                                        ))}
                                        {rx.medicines.length > 3 && (
                                          <Badge variant="outline" className="text-[11px]">
                                            +{rx.medicines.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    {rx.suggestions.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {rx.suggestions.map((s) => (
                                          <p key={s.id} className="text-xs text-muted-foreground">
                                            <span className="font-medium">{s.question}:</span> {s.suggestions}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* No prescription note */}
                                {!rx && (
                                  <p className="text-xs text-muted-foreground italic">No prescription recorded for this visit.</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="mt-4">
            {allPrescriptions.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No prescriptions"
                description="No prescriptions have been created for this patient's visits."
              />
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {allPrescriptions.map((rx, i) => {
                  // Find the visit date for this prescription
                  const visit = visits.find((v) => v.prescriptions.some((p) => p.id === rx.id))
                  return (
                    <motion.div
                      key={rx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className="transition-all hover:shadow-sm hover:border-teal-300 dark:hover:border-teal-700">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {rx.disease && (
                                  <span className="font-semibold text-sm">{rx.disease}</span>
                                )}
                                {visit && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(parseISO(visit.bookingDate), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>

                              {/* Medicines */}
                              {rx.medicines.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {rx.medicines.map((med) => (
                                    <Badge key={med.id} variant="secondary" className="text-[11px]">
                                      {med.medicine}
                                      <span className="ml-1 text-muted-foreground">
                                        {med.morning ? 'M' : ''}{med.afternoon ? 'A' : ''}{med.evening ? 'E' : ''}
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {/* Labels */}
                              {rx.labels.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {rx.labels.map((l) => (
                                    <span key={l.id} className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                      {l.label}: {l.value} {l.labelUnit}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Suggestions */}
                              {rx.suggestions.length > 0 && (
                                <div className="mt-2 space-y-0.5">
                                  {rx.suggestions.map((s) => (
                                    <p key={s.id} className="text-[11px] text-muted-foreground">
                                      <span className="font-medium">{s.question}:</span> {s.suggestions}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 text-xs gap-1 text-teal-600 border-teal-200 hover:bg-teal-50 dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-950/30"
                              asChild
                            >
                              <Link href={`/dashboard/doctor/prescriptions/${rx.id}`}>
                                <ExternalLink className="h-3 w-3" /> View
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Vitals Timeline Tab */}
          <TabsContent value="vitals" className="mt-4">
            {vitalsData.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="No vitals data"
                description="No vitals have been recorded for this patient's visits."
              />
            ) : (
              <div className="space-y-6">
                {/* Weight Timeline */}
                <WeightTimeline visits={vitalsData} />

                {/* BP Timeline */}
                <BPTimeline visits={vitalsData} />

                {/* Temperature Timeline */}
                <TemperatureTimeline visits={vitalsData} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

// ---------- Sub-components ----------

function VitalPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-semibold leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center text-center text-muted-foreground">
        <div className="opacity-30 mb-3">{icon}</div>
        <p className="font-medium">{title}</p>
        <p className="text-sm mt-1 max-w-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

// ---------- Vitals Timeline Components (no chart library) ----------

function WeightTimeline({ visits }: { visits: Visit[] }) {
  const weights = visits.filter((v) => v.weight > 0)
  if (weights.length === 0) return null

  const maxW = Math.max(...weights.map((v) => v.weight))
  const minW = Math.min(...weights.map((v) => v.weight))
  const range = maxW - minW || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          Weight Trend (kg)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {weights.map((v) => {
          const pct = ((v.weight - minW) / range) * 100
          return (
            <div key={v.id} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">
                {format(parseISO(v.bookingDate), 'MMM d')}
              </span>
              <div className="flex-1 h-6 bg-muted/50 rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
              <span className="text-xs font-semibold w-12 text-right">{v.weight}</span>
            </div>
          )
        })}
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
          <span>{minW} kg</span>
          <span>{maxW} kg</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BPTimeline({ visits }: { visits: Visit[] }) {
  const bpData = visits
    .filter((v) => v.prescriptions.some((p) => p.bp))
    .map((v) => {
      const rx = v.prescriptions.find((p) => p.bp)
      return { ...v, bp: rx!.bp }
    })

  if (bpData.length === 0) return null

  // Parse systolic values
  const systolics = bpData
    .map((v) => parseInt(v.bp.split('/')[0], 10))
    .filter((n) => !isNaN(n))

  if (systolics.length === 0) return null

  const maxSys = Math.max(...systolics)
  const minSys = Math.min(...systolics)
  const range = maxSys - minSys || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          Blood Pressure Trend (mmHg)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bpData.map((v) => {
          const sys = parseInt(v.bp.split('/')[0], 10) || 0
          const pct = ((sys - minSys) / range) * 100
          // Color based on BP level
          const barColor = sys > 140 ? 'from-red-500 to-red-400' : sys > 120 ? 'from-amber-500 to-amber-400' : 'from-green-500 to-green-400'

          return (
            <div key={v.id} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">
                {format(parseISO(v.bookingDate), 'MMM d')}
              </span>
              <div className="flex-1 h-6 bg-muted/50 rounded-full relative overflow-hidden">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 bg-gradient-to-r rounded-full', barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
              <span className="text-xs font-semibold w-16 text-right">{v.bp}</span>
            </div>
          )
        })}
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
          <span>{minSys} mmHg</span>
          <span>{maxSys} mmHg</span>
        </div>
      </CardContent>
    </Card>
  )
}

function TemperatureTimeline({ visits }: { visits: Visit[] }) {
  const tempData = visits
    .filter((v) => v.prescriptions.some((p) => p.temperature))
    .map((v) => {
      const rx = v.prescriptions.find((p) => p.temperature)
      return { ...v, temp: parseFloat(rx!.temperature) }
    })
    .filter((v) => !isNaN(v.temp))

  if (tempData.length === 0) return null

  const maxT = Math.max(...tempData.map((v) => v.temp))
  const minT = Math.min(...tempData.map((v) => v.temp))
  const range = maxT - minT || 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-orange-500" />
          Temperature Trend (°F)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tempData.map((v) => {
          const pct = ((v.temp - minT) / range) * 100
          const barColor = v.temp > 99 ? 'from-red-500 to-red-400' : v.temp > 98 ? 'from-amber-500 to-amber-400' : 'from-green-500 to-green-400'

          return (
            <div key={v.id} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20 shrink-0">
                {format(parseISO(v.bookingDate), 'MMM d')}
              </span>
              <div className="flex-1 h-6 bg-muted/50 rounded-full relative overflow-hidden">
                <motion.div
                  className={cn('absolute inset-y-0 left-0 bg-gradient-to-r rounded-full', barColor)}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              </div>
              <span className="text-xs font-semibold w-12 text-right">{v.temp}°F</span>
            </div>
          )
        })}
        <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
          <span>{minT}°F</span>
          <span>{maxT}°F</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Loading Skeleton ----------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <Card>
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 h-2" />
        <CardContent className="p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex gap-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-44" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
