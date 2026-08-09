'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Images,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface GalleryItem {
  id: string
  image: string
  createdAt: string
}

export default function DoctorGalleryPage() {
  const queryClient = useQueryClient()
  const [uploadDialog, setUploadDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ gallery: GalleryItem[] }>({
    queryKey: ['doctor-gallery'],
    queryFn: () => fetch('/api/dashboard/doctor/gallery').then((r) => r.json()),
  })

  const uploadMutation = useMutation({
    mutationFn: (image: string) =>
      fetch('/api/dashboard/doctor/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-gallery'] })
      toast.success('Photo added')
      setUploadDialog(false)
      setImageUrl('')
    },
    onError: () => toast.error('Failed to add photo'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/gallery?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-gallery'] })
      toast.success('Photo deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete photo'),
  })

  const gallery = data?.gallery || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage your clinic photos and credentials.</p>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" /> Upload Photo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Images className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">No photos yet</p>
          <p className="text-sm mt-1 mb-4">Upload your first photo to get started.</p>
          <Button variant="outline" onClick={() => setUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" /> Upload Photo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
            >
              <img
                src={item.image}
                alt="Gallery photo"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                onClick={() => setPreviewImage(item.image)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => uploadMutation.mutate(imageUrl)}
              disabled={!imageUrl.trim() || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
