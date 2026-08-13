'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, Tags, Receipt, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============ Types ============

interface ChargeCategory {
  id: string
  name: string
  description: string
  isTaxable: boolean
  taxPercent: number
  status: string
  sortOrder: number
  chargeItemCount: number
  createdAt: string
  updatedAt: string
}

interface ChargeItem {
  id: string
  categoryId: string
  name: string
  shortCode: string
  unitType: string
  rate: number
  isTaxable: boolean
  taxPercent: number
  status: string
  categoryName: string
  createdAt: string
  updatedAt: string
}

interface CategoryFormData {
  name: string
  description: string
  isTaxable: boolean
  taxPercent: number
}

interface ChargeItemFormData {
  categoryId: string
  name: string
  shortCode: string
  unitType: string
  rate: number
  isTaxable: boolean
  taxPercent: number
}

const EMPTY_CATEGORY_FORM: CategoryFormData = {
  name: '',
  description: '',
  isTaxable: false,
  taxPercent: 0,
}

const EMPTY_ITEM_FORM: ChargeItemFormData = {
  categoryId: '',
  name: '',
  shortCode: '',
  unitType: 'Per Day',
  rate: 0,
  isTaxable: false,
  taxPercent: 0,
}

const UNIT_TYPES = ['Per Day', 'Per Hour', 'Per Session', 'Per Unit', 'Per Visit', 'Flat', 'Per Kg', 'Per Liter']

// ============ Animation Variants ============

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const CARD_COLORS = [
  'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
  'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
  'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
]

// ============ Main Component ============

export default function ChargeMasterClient() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('categories')

  // --- Category Dialog State ---
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ChargeCategory | null>(null)
  const [catForm, setCatForm] = useState<CategoryFormData>(EMPTY_CATEGORY_FORM)

  // --- Item Dialog State ---
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ChargeItem | null>(null)
  const [itemForm, setItemForm] = useState<ChargeItemFormData>(EMPTY_ITEM_FORM)

  // --- Delete Dialog State ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; name: string; type: 'category' | 'item' } | null>(null)

  // --- Filter State for Items ---
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ============ Queries ============

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery<{ categories: ChargeCategory[] }>({
    queryKey: ['charge-categories'],
    queryFn: () => fetch('/api/charge-categories').then((r) => r.json()),
  })

  const {
    data: itemsData,
    isLoading: itemsLoading,
  } = useQuery<{ chargeItems: ChargeItem[] }>({
    queryKey: ['charge-items', filterCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filterCategory && filterCategory !== 'all') params.set('categoryId', filterCategory)
      if (searchQuery) params.set('search', searchQuery)
      const qs = params.toString()
      return fetch(`/api/charge-items${qs ? `?${qs}` : ''}`).then((r) => r.json())
    },
  })

  const categories = categoriesData?.categories || []
  const chargeItems = itemsData?.chargeItems || []

  // ============ Mutations ============

  // --- Category Mutations ---
  const createCategoryMutation = useMutation({
    mutationFn: (payload: CategoryFormData) =>
      fetch('/api/charge-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-categories'] })
      toast.success('Category created successfully')
      closeCatDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to create category')
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryFormData> }) =>
      fetch(`/api/charge-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-categories'] })
      toast.success('Category updated successfully')
      closeCatDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to update category')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/charge-categories/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-categories'] })
      queryClient.invalidateQueries({ queryKey: ['charge-items'] })
      toast.success('Category deactivated successfully')
      closeDeleteDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to deactivate category')
    },
  })

  // --- Item Mutations ---
  const createItemMutation = useMutation({
    mutationFn: (payload: ChargeItemFormData) =>
      fetch('/api/charge-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-items'] })
      queryClient.invalidateQueries({ queryKey: ['charge-categories'] })
      toast.success('Charge item created successfully')
      closeItemDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to create charge item')
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ChargeItemFormData> }) =>
      fetch(`/api/charge-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-items'] })
      toast.success('Charge item updated successfully')
      closeItemDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to update charge item')
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/charge-items/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-items'] })
      queryClient.invalidateQueries({ queryKey: ['charge-categories'] })
      toast.success('Charge item deactivated successfully')
      closeDeleteDialog()
    },
    onError: (err: { error?: string }) => {
      toast.error(err.error || 'Failed to deactivate charge item')
    },
  })

  // ============ Handlers ============

  // --- Category Dialog Handlers ---
  function openCreateCatDialog() {
    setEditingCategory(null)
    setCatForm(EMPTY_CATEGORY_FORM)
    setCatDialogOpen(true)
  }

  function openEditCatDialog(cat: ChargeCategory) {
    setEditingCategory(cat)
    setCatForm({
      name: cat.name,
      description: cat.description,
      isTaxable: cat.isTaxable,
      taxPercent: cat.taxPercent,
    })
    setCatDialogOpen(true)
  }

  function closeCatDialog() {
    setCatDialogOpen(false)
    setEditingCategory(null)
    setCatForm(EMPTY_CATEGORY_FORM)
  }

  function handleCatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!catForm.name.trim()) {
      toast.error('Category name is required')
      return
    }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, payload: catForm })
    } else {
      createCategoryMutation.mutate(catForm)
    }
  }

  // --- Item Dialog Handlers ---
  function openCreateItemDialog() {
    setEditingItem(null)
    setItemForm(EMPTY_ITEM_FORM)
    if (filterCategory && filterCategory !== 'all') {
      setItemForm((f) => ({ ...f, categoryId: filterCategory }))
    }
    setItemDialogOpen(true)
  }

  function openEditItemDialog(item: ChargeItem) {
    setEditingItem(item)
    setItemForm({
      categoryId: item.categoryId,
      name: item.name,
      shortCode: item.shortCode,
      unitType: item.unitType,
      rate: item.rate,
      isTaxable: item.isTaxable,
      taxPercent: item.taxPercent,
    })
    setItemDialogOpen(true)
  }

  function closeItemDialog() {
    setItemDialogOpen(false)
    setEditingItem(null)
    setItemForm(EMPTY_ITEM_FORM)
  }

  function handleItemSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemForm.categoryId) {
      toast.error('Please select a category')
      return
    }
    if (!itemForm.name.trim()) {
      toast.error('Item name is required')
      return
    }
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, payload: itemForm })
    } else {
      createItemMutation.mutate(itemForm)
    }
  }

  // --- Delete Dialog Handlers ---
  function openDeleteDialog(target: { id: string; name: string; type: 'category' | 'item' }) {
    setDeletingTarget(target)
    setDeleteDialogOpen(true)
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false)
    setDeletingTarget(null)
  }

  function confirmDelete() {
    if (!deletingTarget) return
    if (deletingTarget.type === 'category') {
      deleteCategoryMutation.mutate(deletingTarget.id)
    } else {
      deleteItemMutation.mutate(deletingTarget.id)
    }
  }

  const isCatSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending
  const isItemSaving = createItemMutation.isPending || updateItemMutation.isPending

  // ============ Render ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Charge Master</h1>
          <p className="text-sm text-muted-foreground">
            Manage charge categories and items for billing
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Receipt className="h-4 w-4" />
            Charge Items
          </TabsTrigger>
        </TabsList>

        {/* ============ Categories Tab ============ */}
        <TabsContent value="categories" className="mt-6 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} found
            </p>
            <Button onClick={openCreateCatDialog} className="shrink-0 bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {/* Loading Skeleton */}
          {categoriesLoading && <CategoriesSkeleton />}

          {/* Empty State */}
          {!categoriesLoading && categories.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
                <Tags className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No categories yet</h3>
              <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                Create your first charge category to organize billing items.
              </p>
              <Button onClick={openCreateCatDialog} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </motion.div>
          )}

          {/* Category Cards Grid */}
          {!categoriesLoading && categories.length > 0 && (
            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {categories.map((cat, index) => (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${CARD_COLORS[index % CARD_COLORS.length]}`}>
                          <Tags className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={`text-[10px] font-medium ${
                              cat.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {cat.status}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-base">{cat.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {cat.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                          {cat.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3.5 w-3.5" />
                            {cat.chargeItemCount} {cat.chargeItemCount === 1 ? 'item' : 'items'}
                          </span>
                          {cat.isTaxable && (
                            <span className="flex items-center gap-1">
                              Tax: {cat.taxPercent}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditCatDialog(cat)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => openDeleteDialog({ id: cat.id, name: cat.name, type: 'category' })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* ============ Charge Items Tab ============ */}
        <TabsContent value="items" className="mt-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <p className="hidden text-sm text-muted-foreground sm:block">
                {chargeItems.length} {chargeItems.length === 1 ? 'item' : 'items'}
              </p>
              <Button onClick={openCreateItemDialog} className="shrink-0 bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {itemsLoading && <ItemsSkeleton />}

          {/* Empty State */}
          {!itemsLoading && chargeItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
                <Receipt className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No charge items yet</h3>
              <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
                {searchQuery || (filterCategory && filterCategory !== 'all')
                  ? 'No items match your current filters. Try adjusting them.'
                  : 'Create your first charge item to start building your billing catalog.'}
              </p>
              {!searchQuery && (!filterCategory || filterCategory === 'all') && (
                <Button onClick={openCreateItemDialog} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Charge Item
                </Button>
              )}
            </motion.div>
          )}

          {/* Items Table */}
          {!itemsLoading && chargeItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border"
            >
              <div className="max-h-[520px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[25%] min-w-[160px]">Name</TableHead>
                      <TableHead className="w-[10%] min-w-[80px]">Code</TableHead>
                      <TableHead className="w-[18%] min-w-[120px]">Category</TableHead>
                      <TableHead className="w-[12%] min-w-[80px]">Unit</TableHead>
                      <TableHead className="w-[12%] min-w-[90px] text-right">Rate</TableHead>
                      <TableHead className="w-[8%] min-w-[70px]">Status</TableHead>
                      <TableHead className="w-[15%] min-w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargeItems.map((item) => (
                      <TableRow key={item.id} className="group transition-colors hover:bg-muted/30">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                            {item.shortCode || '—'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {item.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.unitType}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          ₹{item.rate.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-medium ${
                              item.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditItemDialog(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => openDeleteDialog({ id: item.id, name: item.name, type: 'item' })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ Category Add/Edit Dialog ============ */}
      <Dialog open={catDialogOpen} onOpenChange={(open) => { if (!open) closeCatDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the charge category details below.'
                : 'Create a new charge category to group billing items.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCatSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Room Charges"
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                placeholder="Brief description of the category"
                value={catForm.description}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="cat-taxable">Taxable</Label>
                <p className="text-xs text-muted-foreground">
                  Apply tax to items in this category
                </p>
              </div>
              <Switch
                id="cat-taxable"
                checked={catForm.isTaxable}
                onCheckedChange={(checked) => setCatForm((f) => ({ ...f, isTaxable: checked }))}
              />
            </div>
            <AnimatePresence>
              {catForm.isTaxable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label htmlFor="cat-tax">Tax Percentage (%)</Label>
                    <Input
                      id="cat-tax"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="e.g. 18"
                      value={catForm.taxPercent || ''}
                      onChange={(e) =>
                        setCatForm((f) => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeCatDialog} disabled={isCatSaving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isCatSaving}>
                {isCatSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editingCategory ? (
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ Item Add/Edit Dialog ============ */}
      <Dialog open={itemDialogOpen} onOpenChange={(open) => { if (!open) closeItemDialog() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Charge Item' : 'Add Charge Item'}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the charge item details below.'
                : 'Create a new charge item for billing purposes.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-cat">Category *</Label>
              <Select
                value={itemForm.categoryId}
                onValueChange={(val) => setItemForm((f) => ({ ...f, categoryId: val }))}
              >
                <SelectTrigger id="item-cat">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.status === 'Active')
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                placeholder="e.g. General Ward Room Rent"
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-code">Short Code</Label>
                <Input
                  id="item-code"
                  placeholder="e.g. GW-RENT"
                  value={itemForm.shortCode}
                  onChange={(e) => setItemForm((f) => ({ ...f, shortCode: e.target.value }))}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unit Type</Label>
                <Select
                  value={itemForm.unitType}
                  onValueChange={(val) => setItemForm((f) => ({ ...f, unitType: val }))}
                >
                  <SelectTrigger id="item-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-rate">Rate (₹) *</Label>
              <Input
                id="item-rate"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1500"
                value={itemForm.rate || ''}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, rate: parseFloat(e.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="item-taxable">Taxable</Label>
                <p className="text-xs text-muted-foreground">
                  Apply tax to this item
                </p>
              </div>
              <Switch
                id="item-taxable"
                checked={itemForm.isTaxable}
                onCheckedChange={(checked) => setItemForm((f) => ({ ...f, isTaxable: checked }))}
              />
            </div>
            <AnimatePresence>
              {itemForm.isTaxable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label htmlFor="item-tax">Tax Percentage (%)</Label>
                    <Input
                      id="item-tax"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="e.g. 18"
                      value={itemForm.taxPercent || ''}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeItemDialog} disabled={isItemSaving}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isItemSaving}>
                {isItemSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : editingItem ? (
                  'Update Item'
                ) : (
                  'Create Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ Delete Confirmation Dialog ============ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deactivate {deletingTarget?.type === 'category' ? 'Category' : 'Charge Item'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate &quot;{deletingTarget?.name}&quot;? This will set its status to
              Inactive. It won&apos;t be available for new billing entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={
                deletingTarget?.type === 'category'
                  ? deleteCategoryMutation.isPending
                  : deleteItemMutation.isPending
              }
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingTarget?.type === 'category'
                ? deleteCategoryMutation.isPending
                  ? 'Deactivating...'
                  : 'Deactivate'
                : deleteItemMutation.isPending
                  ? 'Deactivating...'
                  : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============ Skeleton Components ============

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <Skeleton className="mb-2 h-5 w-28" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-1 h-3 w-20" />
          <div className="mt-3 flex justify-end gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ItemsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[25%]"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="w-[10%]"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="w-[18%]"><Skeleton className="h-4 w-14" /></TableHead>
            <TableHead className="w-[12%]"><Skeleton className="h-4 w-10" /></TableHead>
            <TableHead className="w-[12%]"><Skeleton className="h-4 w-10 ml-auto" /></TableHead>
            <TableHead className="w-[8%]"><Skeleton className="h-4 w-12" /></TableHead>
            <TableHead className="w-[15%]"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
              <TableCell><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
