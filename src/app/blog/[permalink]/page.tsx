'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  ChevronLeft,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  ArrowRight,
  Newspaper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = []
  const regex = /<(h[2-3])[^>]*>(.*?)<\/\1>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      headings.push({ id, text, level: parseInt(match[1][1], 10) })
    }
  }
  return headings
}

function addHeadingIds(html: string): string {
  return html.replace(
    /<(h[2-3])([^>]*)>(.*?)<\/\1>/gi,
    (_match, tag, attrs, content) => {
      const text = content.replace(/<[^>]*>/g, '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      return `<${tag}${attrs} id="${id}">${content}</${tag}>`
    }
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').trim()
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200))
}

export default function BlogDetailPage() {
  const params = useParams()
  const permalink = params.permalink as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeHeading, setActiveHeading] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/blog/${permalink}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setPost(data.post)
        setRelatedPosts(data.relatedPosts || [])
      } catch {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }
    if (permalink) fetchPost()
  }, [permalink])

  // IntersectionObserver for TOC scroll tracking
  useEffect(() => {
    if (!contentRef.current || !post) return
    const headings = contentRef.current.querySelectorAll('h2, h3')
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [post])

  const headings = post ? extractHeadings(post.content) : []
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = post?.title || ''

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
        break
      case 'copy':
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => toast.success('Link copied to clipboard!'))
          .catch(() => toast.error('Failed to copy'))
        return
    }

    if (url) window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400')
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <div className="h-72 bg-muted rounded-xl" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The article you are looking for does not exist or has been removed.
          </p>
          <Link href="/blog">
            <Button
              variant="outline"
              className="border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div
          {...fadeIn}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Link href="/blog" className="hover:text-teal-600 transition-colors">
            Blog
          </Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-foreground font-medium truncate">{post.title}</span>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.article {...fadeIn}>
              {/* Title & Meta */}
              <div className="mb-6">
                <Badge
                  className={`mb-4 ${
                    post.type === 'News'
                      ? 'bg-rose-500 hover:bg-rose-500'
                      : 'bg-teal-500 hover:bg-teal-500'
                  } text-white border-0`}
                >
                  {post.type}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-teal-700" />
                    </div>
                    {post.author?.name || 'Doctorooms Team'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {estimateReadTime(post.content)} min read
                  </span>
                </div>
              </div>

              <Separator className="mb-8" />

              {/* Content */}
              <div
                ref={contentRef}
                className="prose prose-gray dark:prose-invert max-w-none
                  prose-headings:scroll-mt-20
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                  prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-teal-600 dark:prose-a:text-teal-400
                  prose-img:rounded-xl prose-img:my-6
                  prose-ul:my-4 prose-ol:my-4
                  prose-blockquote:border-l-teal-500 prose-blockquote:pl-4
                  prose-code:text-teal-600 dark:prose-code:text-teal-400 prose-code:before:content-[''] prose-code:after:content-['']
                  prose-strong:text-foreground
                  prose-li:mb-1"
                dangerouslySetInnerHTML={{
                  __html: addHeadingIds(post.content),
                }}
              />

              {/* Social Share */}
              <Separator className="my-8" />
              <div>
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share this article
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                  >
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="gap-2 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            </motion.article>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedPosts.map((rp) => (
                    <Link key={rp.id} href={`/blog/${rp.permalink}`}>
                      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                        <CardContent className="p-5">
                          <Badge
                            variant="secondary"
                            className={`mb-3 ${
                              rp.type === 'News'
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                : 'bg-teal-100 text-teal-700 hover:bg-teal-100'
                            }`}
                          >
                            {rp.type}
                          </Badge>
                          <h3 className="font-semibold group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 mb-2">
                            {rp.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {rp.content.replace(/<[^>]*>/g, '').slice(0, 120)}...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
                            <span>{formatDate(rp.createdAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Sticky TOC */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <Card>
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-teal-500" />
                      Table of Contents
                    </h4>
                    <nav className="space-y-1">
                      {headings.map((h) => (
                        <a
                          key={h.id}
                          href={`#${h.id}`}
                          className={`block text-sm py-1.5 transition-all duration-200 border-l-2 ${
                            activeHeading === h.id
                              ? 'border-l-teal-500 text-teal-600 dark:text-teal-400 font-medium pl-3'
                              : 'border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-border pl-3'
                          } ${h.level === 3 ? 'ml-3' : ''}`}
                        >
                          {h.text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>

                {/* Share widget on sidebar */}
                <Card className="mt-4">
                  <CardContent className="p-5">
                    <h4 className="font-semibold text-sm mb-3">Share</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-sky-50 hover:text-sky-600"
                        onClick={() => handleShare('twitter')}
                      >
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => handleShare('facebook')}
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => handleShare('linkedin')}
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
