'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Globe,
  FilePenLine,
  PenLine,
  ImageIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

// ==================== TYPES ====================

interface BlogPost {
  id: string
  title: string
  content: string
  blogImg: string | null
  status: 'Published' | 'Draft'
  createdAt: string
  updatedAt: string
  permalink: string
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

export default function BlogListPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // ---------- Query ----------

  const { data, isLoading } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ['patient-posts'],
    queryFn: () => fetch('/api/patient/posts').then((r) => r.json()),
  })

  const posts = data?.posts || []

  const totalPosts = posts.length
  const publishedCount = posts.filter((p) => p.status === 'Published').length
  const draftCount = posts.filter((p) => p.status === 'Draft').length

  // ---------- Mutation ----------

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/patient/posts/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Delete failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-posts'] })
      toast.success('Post deleted successfully')
      setDeleteId(null)
    },
    onError: () => {
      toast.error('Failed to delete post')
    },
  })

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
            My Blog Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your health articles
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md shadow-teal-500/20 mt-2 sm:mt-0"
        >
          <Link href="/dashboard/patient/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </motion.div>

      {/* ========== B. STATS ROW ========== */}
      <motion.section variants={fadeIn} initial="hidden" animate="visible">
        <div className="grid gap-4 sm:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
                title="Total Posts"
                value={totalPosts}
                icon={FileText}
                gradient="from-teal-500 to-teal-600"
                iconBg="bg-teal-100 dark:bg-teal-900/50"
              />
              <StatCard
                title="Published"
                value={publishedCount}
                icon={Globe}
                gradient="from-emerald-500 to-emerald-600"
                iconBg="bg-emerald-100 dark:bg-emerald-900/50"
              />
              <StatCard
                title="Drafts"
                value={draftCount}
                icon={FilePenLine}
                gradient="from-amber-500 to-amber-600"
                iconBg="bg-amber-100 dark:bg-amber-900/50"
              />
            </>
          )}
        </div>
      </motion.section>

      {/* ========== C. BLOG POSTS GRID ========== */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <PenLine className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            You haven&apos;t written any posts yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share your health knowledge with the community
          </p>
          <Button
            asChild
            className="mt-4 bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Link href="/dashboard/patient/blog/new">
              <Plus className="mr-2 h-4 w-4" />
              Write Your First Post
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
                {/* Blog image area */}
                <div className="relative h-40 w-full overflow-hidden bg-muted">
                  {post.blogImg ? (
                    <img
                      src={post.blogImg}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        post.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                          : 'bg-secondary text-secondary-foreground'
                      }
                    >
                      {post.status === 'Published' ? (
                        <Globe className="mr-1 h-3 w-3" />
                      ) : null}
                      {post.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/patient/blog/${post.id}/edit`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>

                    <AlertDialog
                      open={deleteId === post.id}
                      onOpenChange={(open) =>
                        setDeleteId(open ? post.id : null)
                      }
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your blog post.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(post.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
