'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  File,
  FileImage,
  Upload,
  Plus,
  FolderHeart,
  MoreVertical,
  Pencil,
  Trash2,
  FlaskConical,
  Pill,
  ClipboardList,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const categories = ['All', 'Reports', 'Prescriptions', 'Lab Results', 'Other']

const categoryIcons: Record<string, typeof FileText> = {
  Reports: ClipboardList,
  Prescriptions: Pill,
  'Lab Results': FlaskConical,
  Other: File,
}

const categoryColors: Record<string, string> = {
  Reports: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  Prescriptions: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
  'Lab Results': 'bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
  Other: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400',
}

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith('image/')) return FileImage
  return FileText
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function HealthRecordsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'Other', description: '' })
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['medical-documents', activeTab],
    queryFn: () => {
      const params = activeTab !== 'All' ? `?category=${activeTab}` : ''
      return fetch(`/api/patient/medical-documents${params}`).then((r) => r.json())
    },
  })

  const documents = data?.documents || []
  const counts: Record<string, number> = data?.counts || {}

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/patient/medical-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uploadForm,
          fileName: uploadForm.title,
          fileSize: 0,
          mimeType: 'application/pdf',
        }),
      })
      if (!res.ok) throw new Error('Upload failed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] })
      setUploadOpen(false)
      setUploadForm({ title: '', category: 'Other', description: '' })
    },
    onError: () => {
      toast.error('Failed to upload document')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patient/medical-documents/${id}`, { method: 'DELETE' })
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    toast.info('File uploads will be available once storage is configured')
  }, [])

  const totalDocs = counts['All'] || 0

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Documents"
          value={totalDocs}
          icon={FileText}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Reports"
          value={counts['Reports'] || 0}
          icon={ClipboardList}
          gradient="from-blue-500 to-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/50"
        />
        <StatCard
          title="Prescriptions"
          value={counts['Prescriptions'] || 0}
          icon={Pill}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Lab Results"
          value={counts['Lab Results'] || 0}
          icon={FlaskConical}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Tabs + Upload button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-card data-[state=active]:text-teal-700 dark:data-[state=active]:text-teal-400"
              >
                {cat}
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium">
                  {counts[cat] || 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Medical Document</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!uploadForm.title) {
                  toast.error('Please enter a document title')
                  return
                }
                uploadMutation.mutate()
              }}
              className="space-y-4"
            >
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => toast.info('File picker will be available once storage is configured')}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer',
                  isDragging
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                    : 'border-muted-foreground/25 hover:border-teal-400 hover:bg-muted/50'
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50">
                  <Upload className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <p className="mt-3 text-sm font-medium">
                  {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, Images, Documents up to 10MB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-title">Document Title *</Label>
                <Input
                  id="doc-title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Blood Test Report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-category">Category</Label>
                <Select value={uploadForm.category} onValueChange={(v) => setUploadForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger id="doc-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reports">Reports</SelectItem>
                    <SelectItem value="Prescriptions">Prescriptions</SelectItem>
                    <SelectItem value="Lab Results">Lab Results</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-desc">Description</Label>
                <Textarea
                  id="doc-desc"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setUploadOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderHeart className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            No {activeTab === 'All' ? '' : activeTab.toLowerCase() + ' '}documents yet
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
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          <AnimatePresence>
            {documents.map((doc: {
              id: string
              title: string
              category: string
              fileName: string
              fileSize: number
              mimeType: string
              description: string
              createdAt: string
            }) => {
              const FileIcon = getFileIcon(doc.mimeType)
              const CatIcon = categoryIcons[doc.category] || File
              return (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <Card className="group relative overflow-hidden transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', categoryColors[doc.category] || categoryColors.Other)}>
                          <CatIcon className="h-5 w-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => deleteMutation.mutate(doc.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium leading-snug line-clamp-2">{doc.title}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileIcon className="h-3 w-3" />
                          {doc.fileName || 'Document'}
                        </div>
                        {doc.fileSize > 0 && (
                          <p className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', categoryColors[doc.category] || categoryColors.Other)}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(doc.createdAt), 'MMM d')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
