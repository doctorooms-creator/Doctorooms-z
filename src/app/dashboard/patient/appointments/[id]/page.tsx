'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  Send,
  Pill,
  Thermometer,
  Activity,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  Circle,
  Video,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  Approve: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
  Visited: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Canceled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  Finish: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
}

const timelineIcons: Record<string, typeof CheckCircle2> = {
  Pending: Circle,
  Approve: CheckCircle2,
  Visited: CheckCircle2,
  Finish: CheckCircle2,
  Canceled: XCircle,
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [chatMessage, setChatMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['appointment-detail', id],
    queryFn: () => fetch(`/api/dashboard/patient/appointments/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.chatMessages?.length])

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return
    toast.info('Chat messages require WebSocket connection — coming soon!')
    setChatMessage('')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  const { appointment, doctor, patient, chatMessages, prescriptions, statusTimeline } = data || {}

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Appointment Details</h2>
          <p className="text-xs text-muted-foreground">{appointment?.appointmentNo}</p>
        </div>
        <span
          className={cn(
            'ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
            statusColors[appointment?.status] || 'bg-gray-100 text-gray-700'
          )}
        >
          {appointment?.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor & Patient Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Doctor Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doctor Information</CardTitle>
              </CardHeader>
              <CardContent>
                {doctor ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doctor.img} />
                        <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                          {doctor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                    </div>
                    <Separator />
                    {doctor.hospitalAddress && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctor.hospitalAddress}</span>
                      </div>
                    )}
                    {doctor.experience && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{doctor.experience} experience</span>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50" asChild>
                      <Link href={`/doctors/${doctor.id}`}>View Profile</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Doctor info not available</p>
                )}
              </CardContent>
            </Card>

            {/* Patient Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={patient?.img} />
                      <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {(patient?.name || 'P').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient?.name || appointment?.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment?.gender}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {appointment?.bloodGroup && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Blood: {appointment.bloodGroup}</span>
                      </div>
                    )}
                    {appointment?.age && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Age: {appointment.age}</span>
                      </div>
                    )}
                    {appointment?.weight > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Weight: {appointment.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointment Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {appointment?.bookingDate ? format(new Date(appointment.bookingDate), 'MMM d, yyyy') : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground">Disease:</span>
                  <span className="font-medium">{appointment?.disease || '—'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm sm:col-span-2">
                  <FileText className="mt-0.5 h-4 w-4 text-teal-500" />
                  <span className="text-muted-foreground shrink-0">Description:</span>
                  <span className="text-muted-foreground">{appointment?.description || 'No description provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Video Call - shown when doctor has started a video consultation */}
          {appointment?.bookingMode === 'VideoCall' && appointment?.status === 'Visited' && appointment?.videoRoomId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Card className="overflow-hidden border-teal-200 dark:border-teal-800 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/30 shrink-0">
                      <Video className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                          Doctor has started the call — Join Now
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your video consultation with {doctor?.name || 'your doctor'} is ready.
                      </p>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="lg"
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-600/30 text-base px-6 h-12"
                        onClick={() => router.push(`/dashboard/video-call/${appointment.videoRoomId}`)}
                      >
                        <Video className="h-5 w-5" />
                        Join Video Call
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Chat Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Chat with Doctor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-72 overflow-y-auto p-4 space-y-3">
                {chatMessages?.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
                ) : (
                  chatMessages?.map((msg: { id: string; fromId: string; message: string; createdAt: string; sender: { name: string; img: string; role: string } }) => {
                    const isMe = msg.sender?.role === 'patient'
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={msg.sender.img} />
                          <AvatarFallback className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                            {msg.sender.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-xl px-3 py-2 text-sm',
                            isMe
                              ? 'bg-teal-500 text-white'
                              : 'bg-muted text-foreground'
                          )}
                        >
                          {!isMe && (
                            <p className="mb-0.5 text-[10px] font-medium opacity-60">{msg.sender.name}</p>
                          )}
                          <p>{msg.message}</p>
                          <p className={cn('mt-1 text-[10px] opacity-50', isMe ? 'text-right' : '')}>
                            {format(new Date(msg.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex gap-2"
                >
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[40px] max-h-[100px] resize-none"
                    rows={1}
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-teal-500 hover:bg-teal-600 text-white">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {statusTimeline?.map((step: { status: string; label: string; date: string }, i: number) => {
                  const Icon = timelineIcons[step.status] || Circle
                  const isLast = i === statusTimeline.length - 1
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full',
                            step.status === 'Canceled'
                              ? 'bg-red-100 dark:bg-red-900/50'
                              : 'bg-teal-100 dark:bg-teal-900/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-3.5 w-3.5',
                              step.status === 'Canceled' ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'
                            )}
                          />
                        </div>
                        {!isLast && (
                          <div className="mt-1 h-full min-h-[24px] w-px bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Prescription View */}
          {prescriptions && prescriptions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-teal-500" />
                  Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescriptions.map((rx: {
                  id: string
                  disease: string
                  weight: string
                  bp: string
                  temperature: string
                  description: string
                  medicines: { medicine: string; morning: boolean; afternoon: boolean; evening: boolean; tab: number; dose: string }[]
                  labels: { label: string; value: string; labelUnit: string }[]
                  suggestions: { question: string; suggestions: string }[]
                }) => (
                  <div key={rx.id} className="space-y-3">
                    {/* Vitals */}
                    {(rx.bp || rx.temperature || rx.weight) && (
                      <div className="grid grid-cols-3 gap-2">
                        {rx.bp && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Activity className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.bp}</p>
                            <p className="text-[10px] text-muted-foreground">BP</p>
                          </div>
                        )}
                        {rx.temperature && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Thermometer className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.temperature}</p>
                            <p className="text-[10px] text-muted-foreground">Temp</p>
                          </div>
                        )}
                        {rx.weight && (
                          <div className="rounded-lg bg-muted/50 p-2 text-center">
                            <Activity className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                            <p className="mt-1 text-xs font-medium">{rx.weight}</p>
                            <p className="text-[10px] text-muted-foreground">Weight</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Medicines */}
                    {rx.medicines?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5" /> Medicines
                        </p>
                        <div className="space-y-1.5">
                          {rx.medicines.map((med) => (
                            <div key={med.medicine || med.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                              <span className="font-medium text-sm">{med.medicine}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                {med.morning && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">M</Badge>}
                                {med.afternoon && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">A</Badge>}
                                {med.evening && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">E</Badge>}
                                <span>{med.tab}x {med.dose}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Labels */}
                    {rx.labels?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Lab Results</p>
                        <div className="space-y-1">
                          {rx.labels.map((l) => (
                            <div key={l.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{l.label}</span>
                              <span className="font-medium">{l.value} {l.labelUnit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {rx.suggestions?.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">Doctor&apos;s Advice</p>
                        <div className="space-y-1">
                          {rx.suggestions.map((s) => (
                            <div key={s.id} className="rounded-lg bg-teal-50 p-2 text-sm dark:bg-teal-950/30">
                              <p className="font-medium text-teal-700 dark:text-teal-400">{s.question}</p>
                              <p className="text-muted-foreground">{s.suggestions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rx.description && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        {rx.description}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
