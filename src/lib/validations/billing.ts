import { z } from 'zod'
import { cuidSchema } from './common'

export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online'] as const

export const createIpdBillSchema = z.object({
  admissionId: cuidSchema,
  notes: z.string().max(2000).optional(),
})

export const createPaymentSchema = z.object({
  billId: cuidSchema,
  amount: z.number().positive('Amount must be positive').max(99999999, 'Amount too large'),
  paymentMethod: z.enum(PAYMENT_METHODS),
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

export const dischargeAdvisedSchema = z.object({
  dischargeType: z.enum(['Normal', 'DAMA', 'LAMA', 'Referred', 'Expired']),
  dischargeDate: z.string().min(1, 'Discharge date required'),
  notes: z.string().max(2000).optional(),
})

export const completeDischargeSchema = z.object({
  finalDiagnosis: z.string().max(2000).optional(),
  dischargeSummary: z.string().max(5000).optional(),
})

export type CreateIpdBillInput = z.infer<typeof createIpdBillSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>
export type CreateOpdBillInput = z.infer<typeof createOpdBillSchema>
export type DischargeAdvisedInput = z.infer<typeof dischargeAdvisedSchema>
export type CompleteDischargeInput = z.infer<typeof completeDischargeSchema>
