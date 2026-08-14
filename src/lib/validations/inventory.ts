import { z } from 'zod/v4'
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

/** Alias matching the task naming convention */
export const createItemSchema = createInventoryItemSchema

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  genericName: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  batchNo: z.string().max(100).optional(),
  expiryDate: z.string().max(50).nullable().optional(),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().min(0).optional(),
  reorderQty: z.number().min(0).optional(),
  hsnCode: z.string().max(50).optional(),
  gstPercent: z.number().min(0).max(100).optional(),
  storeLocation: z.string().max(200).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided',
})

export const MOVEMENT_TYPES = ['In', 'Out', 'Adjustment', 'Transfer', 'Return'] as const

export const createMovementSchema = z.object({
  itemId: cuidSchema,
  movementType: z.enum(MOVEMENT_TYPES),
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

export const updatePurchaseOrderSchema = z.object({
  supplierName: z.string().min(1).max(200).optional(),
  supplierContact: z.string().max(200).optional(),
  supplierAddress: z.string().max(500).optional(),
  expectedDate: z.string().max(50).optional(),
  status: z.enum(['Draft', 'Approved', 'Ordered', 'Received', 'Cancelled']).optional(),
  notes: z.string().max(1000).optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided',
})

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type CreateMovementInput = z.infer<typeof createMovementSchema>
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>
