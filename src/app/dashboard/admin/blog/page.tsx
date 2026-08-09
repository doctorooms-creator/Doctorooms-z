'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Newspaper,
  BookOpen,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const typeColors: Record<string, string> = {
  Blog: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400',
  News: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
}

const statusColors: Record<string, string> = {
  Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

interface BlogItem {
  id: string
  title: string
  content: string
  type: string
  status: string
  authorName: string
  createdAt: string
  updatedAt: string
  permalink: string
}

interface BlogResponse {
  posts: BlogItem[]
  total: number
  published: number
  drafts: number
}

export default function AdminBlogPage() {
  const [search, setSearch] = useState('')
  const [editPost, setEditPost] = useState<BlogItem | null>(null)
  const [deletePost, setDeletePost] = useState<BlogItem | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  // Create form state
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState('Blog')
  const [formStatus, setFormStatus] = useState('Draft')

  const { data, isLoading } = useQuery<BlogResponse>({
    queryKey: ['admin-blog', search],
    queryFn: () =>
      fetch(`/api/dashboard/admin/blog?search=${encodeURIComponent(search)}`).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/dashboard/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          type: formType,
          status: formStatus,
        }),
      })
      if (!res.ok) throw new Error('Failed to create post')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Post created successfully')
      setIsCreateOpen(false)
      setFormTitle('')
      setFormContent('')
      setFormType('Blog')
      setFormStatus('Draft')
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    },
    onError: () => toast.error('Failed to create post'),
  })

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editPost) return
      const res = await fetch(`/api/dashboard/admin/blog/${editPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editPost.title,
          content: editPost.content,
          type: editPost.type,
          status: editPost.status,
        }),
      })
      if (!res.ok) throw new Error('Failed to update post')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Post updated successfully')
      setEditPost(null)
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    },
    onError: () => toast.error('Failed to update post'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/admin/blog/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete post')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Post deleted')
      setDeletePost(null)
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    },
    onError: () => toast.error('Failed to delete post'),
  })

  const openEditDialog = (post: BlogItem) => {
    setEditPost({ ...post })
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Posts"
          value={data?.total ?? 0}
          icon={FileText}
          gradient="from-teal-500 to-teal-600"
          iconBg="bg-teal-100 dark:bg-teal-900/50"
        />
        <StatCard
          title="Published"
          value={data?.published ?? 0}
          icon={BookOpen}
          gradient="from-emerald-500 to-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/50"
        />
        <StatCard
          title="Drafts"
          value={data?.drafts ?? 0}
          icon={Newspaper}
          gradient="from-amber-500 to-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/50"
        />
        <StatCard
          title="News Articles"
          value={data?.posts?.filter((p) => p.type === 'News').length ?? 0}
          icon={Newspaper}
          gradient="from-violet-500 to-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/50"
        />
      </div>

      {/* Header with search and create button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Blog & News</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Author</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.posts?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">No posts yet</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsCreateOpen(true)}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create first post
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  <AnimatePresence>
                    {data?.posts?.map((post, i) => (
                      <motion.tr
                        key={post.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="group border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{post.title}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{post.authorName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {post.authorName}
                        </TableCell>
                        <TableCell>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', typeColors[post.type])}>
                            {post.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[post.status])}>
                            {post.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {format(new Date(post.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(post)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletePost(post)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Post Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                placeholder="Enter post title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-content">Content</Label>
              <Textarea
                id="create-content"
                placeholder="Write your content here..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={setFormType}>
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
                <Select value={formStatus} onValueChange={setFormStatus}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => createMutation.mutate()}
              disabled={!formTitle.trim() || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editPost} onOpenChange={() => setEditPost(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {editPost && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editPost.title}
                  onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editPost.content}
                  onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                  rows={8}
                  className="resize-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editPost.type} onValueChange={(v) => setEditPost({ ...editPost, type: v })}>
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
                  <Select value={editPost.status} onValueChange={(v) => setEditPost({ ...editPost, status: v })}>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>
              Cancel
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => editMutation.mutate()}
              disabled={!editPost?.title.trim() || editMutation.isPending}
            >
              {editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={() => setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&ldquo;{deletePost?.title}&rdquo;</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
