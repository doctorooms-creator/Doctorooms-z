'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, PenLine } from 'lucide-react'
import { toast } from 'sonner'

// ==================== ANIMATION VARIANTS ====================

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ==================== MAIN COMPONENT ====================

export default function NewBlogPostPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [blogImg, setBlogImg] = useState('')
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published')

  // ---------- Mutation ----------

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string
      content: string
      status: string
      videoLink?: string
      blogImg?: string
    }) =>
      fetch('/api/receptionist/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receptionist-posts'] })
      toast.success('Blog post created successfully!')
      router.push('/dashboard/receptionist/blog')
    },
    onError: () => {
      toast.error('Failed to create post')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title,
      content,
      status,
      videoLink: videoLink || undefined,
      blogImg: blogImg || undefined,
    })
  }

  const isSubmitting = createMutation.isPending
  const isDisabled = !title.trim() || isSubmitting

  // ==================== RENDER ====================

  return (
    <div className="space-y-8">
      {/* ========== A. BREADCRUMB & PAGE HEADER ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/dashboard/receptionist"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link
            href="/dashboard/receptionist/blog"
            className="hover:text-foreground transition-colors"
          >
            My Blog
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">New Post</span>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20">
            <PenLine className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create New Post
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Share your knowledge with the community
            </p>
          </div>
        </div>
      </motion.div>

      {/* ========== B. FORM CARD ========== */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto"
      >
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <CardTitle className="text-lg font-semibold">
              Post Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter your blog title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog content here..."
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="resize-y min-h-[200px]"
                />
              </div>

              {/* Video Link */}
              <div className="space-y-2">
                <Label htmlFor="videoLink">Video Link</Label>
                <Input
                  id="videoLink"
                  placeholder="YouTube video URL (optional)"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Blog Image URL */}
              <div className="space-y-2">
                <Label htmlFor="blogImg">Blog Image URL</Label>
                <Input
                  id="blogImg"
                  placeholder="Image URL (optional)"
                  value={blogImg}
                  onChange={(e) => setBlogImg(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={status === 'Draft' ? 'outline' : 'default'}
                    onClick={() => setStatus('Draft')}
                    className={
                      status === 'Draft'
                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-400 dark:hover:bg-amber-950'
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-teal-700'
                    }
                  >
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant={status === 'Published' ? 'default' : 'outline'}
                    onClick={() => setStatus('Published')}
                    className={
                      status === 'Published'
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-teal-700'
                        : ''
                    }
                  >
                    Published
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="min-w-[100px]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isDisabled}
                  className="min-w-[140px] bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <PenLine className="mr-2 h-4 w-4" />
                      {status === 'Draft' ? 'Save Draft' : 'Publish'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
