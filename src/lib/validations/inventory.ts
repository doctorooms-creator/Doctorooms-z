import { z } from 'zod'
import { cuidSchema } from './common'

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  category: z.string().max(100).optional(),
  unit: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  hsnCode: z.string().max(50).optional(),
  gstPercent: z.number().min(0).max(100).default(0),
  minStockLevel: z.number().min(0).default(10),
  manufacturer: z.string().max(200).optional(),
  batchNo: z.string().max(100).optional(),
  expiryDate: z.string().max(50).optional(),
  purchaseRate: z.number().min(0).optional(),
  mrp: z.number().min(0).optional(),
})

export const createMovementSchema = z.object({
  itemId: cuidSchema,
  movementType: z.enum(['In', 'Out', 'Adjustment', 'Transfer', 'Return']),
  quantity: z.number().positive('Quantity must be positive').max(99999),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().min(1, 'Supplier required').max(200),
  items: z.array(z.object({
    itemId: cuidSchema,
    quantity: z.number().positive().max(99999),
    unitRate: z.number().min(0).max(9999999),
  })).min(1, 'At least one item required'),
  notes: z.string().max(1000).optional(),
})

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
