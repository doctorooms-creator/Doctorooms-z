import { z } from 'zod/v4'
import { cuidSchema } from './common'

export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online'] as const

export const createIpdBillSchema = z.object({
  admissionId: cuidSchema,
  notes: z.string().max(2000).optional(),
})

export const createOpdBillSchema = z.object({
  bookingId: cuidSchema,
  consultationFee: z.number().min(0).default(0),
  labCharges: z.number().min(0).default(0),
  medicineCharges: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).default('Cash'),
  paymentRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const createPaymentSchema = z.object({
  billId: cuidSchema,
  amount: z.number().positive('Amount must be positive').max(99999999, 'Amount too large'),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  paymentRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const createAdvanceSchema = z.object({
  admissionId: cuidSchema,
  amount: z.number().positive('Amount must be positive').max(99999999, 'Amount too large'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('Cash'),
  paymentRef: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export const finalizeBillSchema = z.object({}).passthrough()

export type CreateIpdBillInput = z.infer<typeof createIpdBillSchema>
export type CreateOpdBillInput = z.infer<typeof createOpdBillSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>
