'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Star,
  MessageSquare,
  Calendar,
  Stethoscope,
  Check,
  Clock,
  Users,
  ThumbsUp,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FeedbackItem {
  id: string
  appointmentNo: string
  doctorName: string
  doctorImg: string
  doctorUserId: string
  disease: string
  date: string
  status: string
  alreadyRated: boolean
}

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  const [hovered, setHovered] = useState(0)
  const isSm = size === 'sm'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          className={cn(
            'transition-colors',
            onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'
          )}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={cn(
              isSm ? 'h-4 w-4' : 'h-6 w-6',
              (hovered || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  )
}

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function FeedbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [rateOpen, setRateOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<FeedbackItem | null>(null)
  const [form, setForm] = useState({
    star: 5,
    consultationRating: 4,
    waitTimeRating: 4,
    staffRating: 4,
    review: '',
    wouldRecommend: true,
    isAnonymous: false,
  })

  // Check for URL params from appointment detail navigation
  const urlBookingId = searchParams.get('bookingId')
  const urlDoctorId = searchParams.get('doctorId')

  const { data, isLoading } = useQuery<{
    feedback: FeedbackItem[]
  }>({
    queryKey: ['patient-feedback'],
    queryFn: () => fetch('/api/patient/feedback').then((r) => r.json()),
  })

  const feedbackList = data?.feedback || []

  // Auto-open rate dialog when navigated from appointment detail with params
  // Use useCallback for the action triggered by URL params
  const hasAutoOpened = useRef(false)

  useEffect(() => {
    if (hasAutoOpened.current) return
    if (!urlBookingId || !urlDoctorId || feedbackList.length === 0) return
    const target = feedbackList.find((b) => b.id === urlBookingId)
    if (!target || target.alreadyRated) return
    hasAutoOpened.current = true
    // Use microtask to avoid React's setState-in-effect rule
    queueMicrotask(() => {
      setSelectedBooking(target)
      setRateOpen(true)
      router.replace('/dashboard/patient/feedback', { scroll: false })
    })
  }, [urlBookingId, urlDoctorId, feedbackList, router])

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) throw new Error('No booking selected')
      const res = await fetch('/api/patient/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          doctorUserId: selectedBooking.doctorUserId,
          ...form,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully!')
      queryClient.invalidateQueries({ queryKey: ['patient-feedback'] })
      setRateOpen(false)
      setForm({
        star: 5,
        consultationRating: 4,
        waitTimeRating: 4,
        staffRating: 4,
        review: '',
        wouldRecommend: true,
        isAnonymous: false,
      })
      setSelectedBooking(null)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const openRateDialog = (item: FeedbackItem) => {
    if (item.alreadyRated) return
    setSelectedBooking(item)
    setRateOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl border border-border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Feedback & Ratings</h2>
        <p className="text-sm text-muted-foreground">
          Rate your consultation experience and help other patients
        </p>
      </div>

      {feedbackList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            No completed appointments to review
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Once you complete an appointment, you can rate your experience here
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feedbackList.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                'group relative transition-all hover:shadow-md',
                item.alreadyRated && 'opacity-75'
              )}>
                {item.alreadyRated && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    Rated
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={item.doctorImg} />
                      <AvatarFallback className="bg-teal-100 text-sm font-semibold text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                        {item.doctorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.doctorName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        {item.disease || 'General Consultation'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {item.status}
                    </span>
                  </div>

                  {/* Show appointment number being rated */}
                  {item.appointmentNo && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/70 font-mono">
                      {item.appointmentNo}
                    </p>
                  )}

                  <Separator className="my-4" />

                  {item.alreadyRated ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>Thank you for your feedback!</span>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                      onClick={() => openRateDialog(item)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Rate This Visit
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rate Dialog */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-5">
              {/* Doctor info + booking context */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedBooking.doctorImg} />
                  <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                    {selectedBooking.doctorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{selectedBooking.doctorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBooking.disease || 'General Consultation'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedBooking.date), 'MMM d, yyyy')} &middot; {selectedBooking.appointmentNo}
                  </p>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Overall Rating</Label>
                <div className="flex items-center gap-3">
                  <StarRating value={form.star} onChange={(v) => setForm((f) => ({ ...f, star: v }))} />
                  <span className="text-sm text-muted-foreground">{ratingLabels[form.star - 1]}</span>
                </div>
              </div>

              <Separator />

              {/* Detailed Ratings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Stethoscope className="h-4 w-4 text-teal-500" />
                    Consultation Quality
                  </Label>
                  <div className="flex items-center gap-3">
                    <StarRating value={form.consultationRating} onChange={(v) => setForm((f) => ({ ...f, consultationRating: v }))} size="sm" />
                    <span className="text-xs text-muted-foreground">{ratingLabels[form.consultationRating - 1]}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-teal-500" />
                    Wait Time
                  </Label>
                  <div className="flex items-center gap-3">
                    <StarRating value={form.waitTimeRating} onChange={(v) => setForm((f) => ({ ...f, waitTimeRating: v }))} size="sm" />
                    <span className="text-xs text-muted-foreground">{ratingLabels[form.waitTimeRating - 1]}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4 text-teal-500" />
                    Staff Behavior
                  </Label>
                  <div className="flex items-center gap-3">
                    <StarRating value={form.staffRating} onChange={(v) => setForm((f) => ({ ...f, staffRating: v }))} size="sm" />
                    <span className="text-xs text-muted-foreground">{ratingLabels[form.staffRating - 1]}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Written Review */}
              <div className="space-y-2">
                <Label htmlFor="review" className="text-sm font-medium">Your Review (Optional)</Label>
                <Textarea
                  id="review"
                  value={form.review}
                  onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                  placeholder="Share your experience..."
                  rows={3}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-teal-500" />
                    Would you recommend this doctor?
                  </Label>
                  <Switch
                    checked={form.wouldRecommend}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, wouldRecommend: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Submit anonymously
                  </Label>
                  <Switch
                    checked={form.isAnonymous}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isAnonymous: v }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setRateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
