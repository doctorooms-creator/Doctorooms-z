'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Heart,
  Upload,
  Trash2,
  Download,
  Calendar,
  Stethoscope,
  Pill,
  Plus,
  FolderOpen,
  Eye,
  ClipboardList,
  FlaskConical,
  ImageIcon,
  Syringe,
  Users,
  FileUp,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ==================== CONSTANTS ====================

const DOCUMENT_CATEGORIES = [
  'Lab Report',
  'Prescription',
  'Test Results',
  'Scan/X-Ray',
  'Vaccination Record',
  'Other',
] as const

const FILTER_TABS = ['All', ...DOCUMENT_CATEGORIES] as const

type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

const categoryIconMap: Record<string, React.ElementType> = {
  'Lab Report': ClipboardList,
  'Prescription': Pill,
  'Test Results': FlaskConical,
  'Scan/X-Ray': ImageIcon,
  'Vaccination Record': Syringe,
  Other: FileText,
}

const categoryColorMap: Record<string, string> = {
  'Lab Report': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  'Prescription': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Test Results': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Scan/X-Ray': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  'Vaccination Record': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-400',
}

const categoryIconBgMap: Record<string, string> = {
  'Lab Report': 'bg-teal-100 dark:bg-teal-900/50',
  'Prescription': 'bg-emerald-100 dark:bg-emerald-900/50',
  'Test Results': 'bg-amber-100 dark:bg-amber-900/50',
  'Scan/X-Ray': 'bg-rose-100 dark:bg-rose-900/50',
  'Vaccination Record': 'bg-sky-100 dark:bg-sky-900/50',
  Other: 'bg-gray-100 dark:bg-gray-900/50',
}

const categoryIconColorMap: Record<string, string> = {
  'Lab Report': 'text-teal-600 dark:text-teal-400',
  'Prescription': 'text-emerald-600 dark:text-emerald-400',
  'Test Results': 'text-amber-600 dark:text-amber-400',
  'Scan/X-Ray': 'text-rose-600 dark:text-rose-400',
  'Vaccination Record': 'text-sky-600 dark:text-sky-400',
  Other: 'text-gray-600 dark:text-gray-400',
}

// ==================== HELPERS ====================

function formatFileSize(bytes: number) {
  if (!bytes || bytes === 0) return null
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ==================== TYPES ====================

interface VisitStats {
  completedVisits: number
  lastVisitDate: string | null
  totalDoctors: number
  prescriptionsReceived: number
}

interface PrescriptionItem {
  id: string
  disease: string
  description: string
  medicinesCount: number
  doctorName: string
  doctorImg: string
  bookingId: string
  appointmentNo: string
  bookingDate: string | null
  createdAt: string
}

interface DocumentItem {
  id: string
  title: string
  category: string
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  description: string
  createdAt: string
}

// ==================== ANIMATION VARIANTS ====================

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ==================== MAIN COMPONENT ====================

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState<string>('All')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Other' as DocumentCategory,
    description: '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const queryClient = useQueryClient()

  // ---------- Queries ----------

  const { data: statsData, isLoading: statsLoading } = useQuery<VisitStats>({
    queryKey: ['patient-health-stats'],
    queryFn: () =>
      fetch('/api/dashboard/patient/stats').then((r) => r.json()),
  })

  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery<{
    prescriptions: PrescriptionItem[]
  }>({
    queryKey: ['patient-prescriptions'],
    queryFn: () =>
      fetch('/api/dashboard/patient/prescriptions').then((r) => r.json()),
  })

  const { data: docsData, isLoading: docsLoading } = useQuery<{
    documents: DocumentItem[]
    counts: Record<string, number>
  }>({
    queryKey: ['medical-documents', activeTab],
    queryFn: () => {
      const params =
        activeTab !== 'All' ? `?category=${activeTab}` : ''
      return fetch(`/api/patient/medical-documents${params}`).then((r) =>
        r.json()
      )
    },
  })

  const documents = docsData?.documents || []
  const docCounts: Record<string, number> = docsData?.counts || {}
  const prescriptions = prescriptionsData?.prescriptions || []

  // ---------- Mutations ----------

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadForm.title.trim()) {
        throw new Error('Please enter a document title')
      }
      const formData = new FormData()
      formData.append('title', uploadForm.title.trim())
      formData.append('category', uploadForm.category)
      formData.append('description', uploadForm.description)
      if (selectedFile) {
        formData.append('file', selectedFile)
      }
      const res = await fetch('/api/patient/medical-documents', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      return data
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] })
      queryClient.invalidateQueries({ queryKey: ['patient-health-stats'] })
      setUploadOpen(false)
      setUploadForm({ title: '', category: 'Other', description: '' })
      setSelectedFile(null)
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to upload document')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patient/medical-documents/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
    },
    onSuccess: () => {
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] })
    },
    onError: () => {
      toast.error('Failed to delete document')
    },
  })

  // ---------- Handlers ----------

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, PNG, DOC, and DOCX files are allowed')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
    // Auto-fill title from filename if empty
    if (!uploadForm.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      setUploadForm((f) => ({ ...f, title: nameWithoutExt }))
    }
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.title.trim()) {
      toast.error('Please enter a document title')
      return
    }
    uploadMutation.mutate()
  }

  const stats = statsData || {
    completedVisits: 0,
    lastVisitDate: null,
    totalDoctors: 0,
    prescriptionsReceived: 0,
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-8">
      {/* ========== A. PAGE HEADER ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Health Records
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your medical documents and visit history
          </p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20">
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Medical Document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-file">
                  File <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-950/50 dark:file:text-teal-400 dark:hover:file:bg-teal-900/50 file:cursor-pointer cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                      <FileUp className="h-3 w-3" />
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  PDF, JPG, PNG, DOC, DOCX — Max 5MB
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="doc-title"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g., Blood Test Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-category">Category</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(v) =>
                    setUploadForm((f) => ({
                      ...f,
                      category: v as DocumentCategory,
                    }))
                  }
                >
                  <SelectTrigger id="doc-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-desc">Description</Label>
                <Textarea
                  id="doc-desc"
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional notes about this document"
                  rows={3}
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUploadOpen(false)
                    setSelectedFile(null)
                    setUploadForm({ title: '', category: 'Other', description: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* ========== B. VISIT SUMMARY SECTION ========== */}
      <motion.section variants={fadeIn} initial="hidden" animate="visible">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[100px] rounded-xl border border-border bg-card"
              >
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Total Visits"
                value={stats.completedVisits}
                icon={Stethoscope}
                gradient="from-teal-500 to-teal-600"
                iconBg="bg-teal-100 dark:bg-teal-900/50"
              />
              <StatCard
                title="Last Visit"
                value={
                  stats.lastVisitDate
                    ? formatDistanceToNow(new Date(stats.lastVisitDate), {
                        addSuffix: true,
                      })
                    : 'N/A'
                }
                icon={Calendar}
                gradient="from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/50"
              />
              <StatCard
                title="Doctors Visited"
                value={stats.totalDoctors}
                icon={Users}
                gradient="from-amber-500 to-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/50"
              />
              <StatCard
                title="Prescriptions"
                value={stats.prescriptionsReceived}
                icon={Pill}
                gradient="from-rose-500 to-rose-600"
                iconBg="bg-rose-100 dark:bg-rose-900/50"
              />
            </>
          )}
        </div>
      </motion.section>

      <Separator />

      {/* ========== C. PAST PRESCRIPTIONS SECTION ========== */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-lg font-semibold">Past Prescriptions</h2>
        </div>

        {prescriptionsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-border bg-card"
              >
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Pill className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No prescriptions yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your prescriptions from completed visits will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            <motion.div
              className="space-y-3"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {prescriptions.map((rx) => {
                const dateStr = rx.bookingDate
                  ? format(new Date(rx.bookingDate), 'MMM d, yyyy')
                  : format(new Date(rx.createdAt), 'MMM d, yyyy')
                return (
                  <motion.div key={rx.id} variants={itemVariants}>
                    <Card className="group transition-all hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                              <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate">
                                  {rx.doctorName}
                                </p>
                                {rx.disease && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {rx.disease}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {dateStr}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Pill className="h-3 w-3" />
                                  {rx.medicinesCount}{' '}
                                  {rx.medicinesCount === 1 ? 'medicine' : 'medicines'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link href={`/dashboard/patient/appointments/${rx.bookingId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/50 shrink-0"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}
      </motion.section>

      <Separator />

      {/* ========== D. DOCUMENTS SECTION ========== */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg font-semibold">Medical Documents</h2>
          </div>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab}
                <span
                  className={cn(
                    'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                    activeTab === tab
                      ? 'bg-teal-200/60 dark:bg-teal-800/60'
                      : 'bg-background/60'
                  )}
                >
                  {docCounts[tab] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {docsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl border border-border bg-card"
              >
                <Skeleton className="h-full w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No{' '}
              {activeTab === 'All'
                ? 'documents'
                : activeTab.toLowerCase() + ' documents'}{' '}
              yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload your first medical document to get started
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/50"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence mode="popLayout">
              {documents.map((doc) => {
                const CatIcon = categoryIconMap[doc.category] || FileText
                const dateStr = format(
                  new Date(doc.createdAt),
                  'MMM d, yyyy'
                )
                const sizeStr = formatFileSize(doc.fileSize)

                return (
                  <motion.div
                    key={doc.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="group relative h-full overflow-hidden transition-all hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800">
                      <CardContent className="p-4 flex flex-col h-full">
                        {/* Top row: icon + actions */}
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              'flex h-11 w-11 items-center justify-center rounded-xl',
                              categoryIconBgMap[doc.category] ||
                                categoryIconBgMap.Other
                            )}
                          >
                            <CatIcon
                              className={cn(
                                'h-5 w-5',
                                categoryIconColorMap[doc.category] ||
                                  categoryIconColorMap.Other
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.fileName && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-teal-600"
                                asChild
                              >
                                <a
                                  href={`/api/patient/medical-documents/${doc.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() =>
                                deleteMutation.mutate(doc.id)
                              }
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mt-3 flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-snug line-clamp-2">
                            {doc.title}
                          </p>
                          {doc.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom row: badge + date */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/50">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-medium border-0',
                              categoryColorMap[doc.category] ||
                                categoryColorMap.Other
                            )}
                          >
                            {doc.category}
                          </Badge>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {sizeStr && <span>{sizeStr}</span>}
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.section>
    </div>
  )
}