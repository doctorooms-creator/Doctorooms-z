import { z } from 'zod/v4'
import { cuidSchema } from './common'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name required').max(200),
  description: z.string().max(1000).optional(),
  isTaxable: z.boolean().optional(),
  taxPercent: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().min(0).default(0),
})

export const createChargeItemSchema = z.object({
  categoryId: cuidSchema,
  name: z.string().min(1, 'Item name required').max(200),
  shortCode: z.string().max(50).optional(),
  unitType: z.string().max(50).default('Per Day'),
  rate: z.number().min(0).default(0),
  isTaxable: z.boolean().optional(),
  taxPercent: z.number().min(0).max(100).default(0),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type CreateChargeItemInput = z.infer<typeof createChargeItemSchema>
