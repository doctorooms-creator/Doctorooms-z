'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Tags, Search, RefreshCw, Package } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

// ============ Types ============

interface ChargeCategory {
  id: string
  name: string
  description: string
  taxPercent: number
  status: string
  hospitalName: string
  itemsCount: number
  createdAt: string
}

interface CategoriesResponse {
  categories: ChargeCategory[]
}

// ============ Helpers ============

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Active</Badge>
    case 'Inactive':
      return <Badge variant="outline" className="border-slate-400 text-slate-600 bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ============ Component ============

export default function AdminChargeCategoriesClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<CategoriesResponse>({
    queryKey: ['admin-charge-categories', activeTab, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab !== 'All') params.set('status', activeTab)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/charge-categories?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load charge categories')
      return res.json()
    },
  })

  const categories = data?.categories || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <Tags className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Charge Categories (All Hospitals)</h1>
          <p className="text-sm text-muted-foreground">Global read-only view of billing charge categories</p>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search + Refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-charge-categories'] })}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold leading-tight">{cat.name}</CardTitle>
                    {getStatusBadge(cat.status)}
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{cat.hospitalName}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cat.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-semibold">{cat.itemsCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-semibold">{cat.taxPercent}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Tags className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No charge categories found</p>
          {activeTab !== 'All' && (
            <p className="text-sm mt-1">Try changing the status filter</p>
          )}
        </div>
      )}
    </div>
  )
}
