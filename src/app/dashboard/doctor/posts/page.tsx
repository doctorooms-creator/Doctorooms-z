'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  PenSquare,
  Plus,
  Trash2,
  Pencil,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Post {
  id: string
  title: string
  content: string
  type: string
  status: string
  permalink: string
  createdAt: string
  updatedAt: string
}

export default function DoctorPostsPage() {
  const queryClient = useQueryClient()
  const [postDialog, setPostDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', type: 'Blog', status: 'Draft' })

  const { data, isLoading } = useQuery<{ posts: Post[] }>({
    queryKey: ['doctor-posts'],
    queryFn: () => fetch('/api/dashboard/doctor/posts').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/dashboard/doctor/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-posts'] })
      toast.success('Post created')
      closeDialog()
    },
    onError: () => toast.error('Failed to create post'),
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/dashboard/doctor/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-posts'] })
      toast.success('Post updated')
      closeDialog()
    },
    onError: () => toast.error('Failed to update post'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/dashboard/doctor/posts?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-posts'] })
      toast.success('Post deleted')
      setDeleteId(null)
    },
    onError: () => toast.error('Failed to delete post'),
  })

  const openCreateDialog = () => {
    setEditingPost(null)
    setForm({ title: '', content: '', type: 'Blog', status: 'Draft' })
    setPostDialog(true)
  }

  const openEditDialog = (post: Post) => {
    setEditingPost(post)
    setForm({ title: post.title, content: post.content, type: post.type, status: post.status })
    setPostDialog(true)
  }

  const closeDialog = () => {
    setPostDialog(false)
    setEditingPost(null)
    setForm({ title: '', content: '', type: 'Blog', status: 'Draft' })
  }

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, ...form })
    } else {
      createMutation.mutate(form)
    }
  }

  const posts = data?.posts || []
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Write blog posts and news articles for your patients.</p>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <PenSquare className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1 mb-4">Share your knowledge by writing a blog post.</p>
          <Button variant="outline" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Write First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group transition-all hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                        <Badge
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            post.type === 'Blog'
                              ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                          )}
                        >
                          {post.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            post.status === 'Published'
                              ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                              : 'border-muted-foreground/30 text-muted-foreground'
                          )}
                        >
                          {post.status}
                        </Badge>
                      </div>
                      {post.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(post)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Post Dialog */}
      <Dialog open={postDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Post title..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="News">News</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your post content..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : editingPost ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
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
    </div>
  )
}
