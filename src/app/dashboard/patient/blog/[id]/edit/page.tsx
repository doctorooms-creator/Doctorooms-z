'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, PenLine, FileQuestion } from 'lucide-react'
import { toast } from 'sonner'

// ==================== TYPES ====================

interface BlogPost {
  id: string
  title: string
  content: string
  blogImg: string | null
  videoLink: string | null
  status: 'Published' | 'Draft'
  createdAt: string
  updatedAt: string
  permalink: string
}

// ==================== ANIMATION VARIANTS ====================

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ==================== FORM COMPONENT (mounted only when post exists) ====================

function EditBlogForm({ post, id }: { post: BlogPost; id: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(post.title || '')
  const [content, setContent] = useState(post.content || '')
  const [videoLink, setVideoLink] = useState(post.videoLink || '')
  const [blogImg, setBlogImg] = useState(post.blogImg || '')
  const [status, setStatus] = useState<'Published' | 'Draft'>(post.status || 'Draft')

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; content: string; status: string; videoLink?: string; blogImg?: string }) =>
      fetch(`/api/patient/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => { if (!r.ok) throw new Error('Failed to update post'); return r.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-posts'] })
      queryClient.invalidateQueries({ queryKey: ['patient-post', id] })
      toast.success('Blog post updated successfully!')
      router.push('/dashboard/patient/blog')
    },
    onError: () => toast.error('Failed to update post'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ title, content, status, videoLink: videoLink || undefined, blogImg: blogImg || undefined })
  }

  const isSubmitting = updateMutation.isPending
  const isDisabled = !title.trim() || isSubmitting

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <CardTitle className="text-lg font-semibold">Post Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input id="title" placeholder="Enter your blog title" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" placeholder="Write your blog content here..." rows={10} value={content} onChange={(e) => setContent(e.target.value)} className="resize-y min-h-[200px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoLink">Video Link</Label>
              <Input id="videoLink" placeholder="YouTube video URL (optional)" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blogImg">Blog Image URL</Label>
              <Input id="blogImg" placeholder="Image URL (optional)" value={blogImg} onChange={(e) => setBlogImg(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={status === 'Draft' ? 'outline' : 'default'}
                  onClick={() => setStatus('Draft')}
                  className={status === 'Draft'
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-950'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-teal-700'
                  }
                >Draft</Button>
                <Button
                  type="button"
                  variant={status === 'Published' ? 'default' : 'outline'}
                  onClick={() => setStatus('Published')}
                  className={status === 'Published'
                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-teal-700'
                    : ''
                  }
                >Published</Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} className="min-w-[100px]">
                <ArrowLeft className="mr-2 h-4 w-4" />Cancel
              </Button>
              <Button
                type="submit"
                disabled={isDisabled}
                className="min-w-[140px] bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20 disabled:opacity-50"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                  : <><PenLine className="mr-2 h-4 w-4" />Update Post</>
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

export default function EditBlogPostPage() {
  const params = useParams()
  const id = params.id as string

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ['patient-post', id],
    queryFn: () => fetch(`/api/patient/posts/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  // ==================== RENDER: LOADING ====================

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-3" /><Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="border-b bg-muted/30"><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-11 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-[200px] w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-11 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-11 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-12" /><div className="flex gap-2"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-28" /></div></div>
              <div className="flex justify-end gap-3 pt-4 border-t"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-32" /></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ==================== RENDER: NOT FOUND ====================

  if (isError || !post) {
    return (
      <div className="space-y-8">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/dashboard/patient" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span className="text-muted-foreground/50">/</span>
          <Link href="/dashboard/patient/blog" className="hover:text-foreground transition-colors">My Blog</Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">Edit Post</span>
        </nav>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Post Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">The blog post you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
          <Button asChild className="mt-6 bg-teal-500 hover:bg-teal-600 text-white">
            <Link href="/dashboard/patient/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to My Blog</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  // ==================== RENDER: FORM ====================

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/dashboard/patient" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span className="text-muted-foreground/50">/</span>
          <Link href="/dashboard/patient/blog" className="hover:text-foreground transition-colors">My Blog</Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">Edit Post</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20">
            <PenLine className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Edit Post</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Update your blog post details</p>
          </div>
        </div>
      </motion.div>
      <EditBlogForm post={post} id={id} />
    </div>
  )
}
