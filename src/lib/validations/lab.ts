import { z } from 'zod/v4'
import { cuidSchema } from './common'

export const createLabReportSchema = z.object({
  admissionId: cuidSchema.optional(),
  bookingId: cuidSchema.optional(),
  testMasterId: cuidSchema,
  patientName: z.string().min(1, 'Patient name required').max(200),
  patientAge: z.string().max(20).optional(),
  patientGender: z.enum(['Male', 'Female', 'Other']).optional(),
  urgency: z.enum(['Normal', 'Urgent', 'STAT']).default('Normal'),
  orderedById: cuidSchema.optional(),
  notes: z.string().max(1000).optional(),
}).refine(d => d.admissionId || d.bookingId, {
  message: 'Either admissionId or bookingId is required',
  path: ['admissionId'],
})

export const enterResultSchema = z.object({
  parameters: z.array(z.object({
    parameterId: cuidSchema,
    resultValue: z.string().min(1, 'Result value required').max(100),
    isAbnormal: z.boolean().optional(),
    notes: z.string().max(200).optional(),
  })).min(1, 'At least one parameter result is required'),
  notes: z.string().max(2000).optional(),
})

export const verifySchema = z.object({
  notes: z.string().max(500).optional(),
})

export const collectSampleSchema = z.object({
  collectedBy: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export type CreateLabReportInput = z.infer<typeof createLabReportSchema>
export type EnterResultInput = z.infer<typeof enterResultSchema>
export type VerifyInput = z.infer<typeof verifySchema>
export type CollectSampleInput = z.infer<typeof collectSampleSchema>
