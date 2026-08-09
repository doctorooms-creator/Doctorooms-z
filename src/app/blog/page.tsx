'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, User, Newspaper, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout/public-layout'

interface BlogPost {
  id: string
  title: string
  permalink: string
  content: string
  blogImg: string
  type: string
  createdAt: string
  author: {
    id: string
    name: string
    profileImg: string
  }
}

const CATEGORIES = ['All', 'Blog', 'News']
const PAGE_SIZE = 9

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

function getExcerpt(html: string, maxLen = 150): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/&\w+;/g, ' ').trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').trim()
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: PAGE_SIZE.toString(),
      })
      if (category !== 'All') params.set('type', category)

      const res = await fetch(`/api/blog?${params.toString()}`)
      const data = await res.json()
      setPosts(data.posts || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPage(1)
  }

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div {...fadeIn} className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Health Blog & News</h1>
            <p className="text-teal-100 text-lg">
              Stay informed with the latest health tips, medical news, and expert insights
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Category Tabs */}
        <motion.div {...fadeIn} className="mb-8">
          <Tabs value={category} onValueChange={handleCategoryChange}>
            <TabsList className="bg-muted">
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="gap-2 data-[state=active]:bg-teal-500 data-[state=active]:text-white">
                  {cat === 'Blog' && <FileText className="h-4 w-4" />}
                  {cat === 'News' && <Newspaper className="h-4 w-4" />}
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div {...fadeIn} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
              <Newspaper className="h-10 w-10 text-teal-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground max-w-md">
              {category !== 'All'
                ? `No ${category.toLowerCase()} articles available yet. Check back soon!`
                : 'No articles available yet. Check back soon!'}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {posts.map((post) => (
                <motion.div key={post.id} variants={fadeIn}>
                  <Link href={`/blog/${post.permalink}`}>
                    <Card className="group overflow-hidden border-border/60 hover:shadow-lg hover:border-l-teal-500 hover:border-l-4 transition-all duration-300 h-full flex flex-col">
                      {/* Image placeholder */}
                      <div className="h-48 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 flex items-center justify-center relative overflow-hidden">
                        {post.blogImg && post.blogImg !== 'default.png' ? (
                          <img
                            src={post.blogImg}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Newspaper className="h-12 w-12 text-teal-300 dark:text-teal-700" />
                        )}
                        <Badge
                          className={`absolute top-3 right-3 ${
                            post.type === 'News'
                              ? 'bg-rose-500 hover:bg-rose-500'
                              : 'bg-teal-500 hover:bg-teal-500'
                          } text-white border-0`}
                        >
                          {post.type}
                        </Badge>
                      </div>

                      <CardContent className="p-5 flex-1 flex flex-col">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                          {getExcerpt(post.content)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {post.author?.name || 'Doctorooms Team'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div {...fadeIn} className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="gap-1 border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className={
                        p === page
                          ? 'bg-teal-500 hover:bg-teal-600 text-white'
                          : 'border-teal-200 text-teal-700 hover:bg-teal-50'
                      }
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="gap-1 border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  )
}
