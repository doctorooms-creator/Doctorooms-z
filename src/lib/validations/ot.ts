import { z } from 'zod'
import { cuidSchema } from './common'

export const createOtScheduleSchema = z.object({
  otId: cuidSchema,
  admissionId: cuidSchema,
  surgeryName: z.string().min(1, 'Surgery name required').max(300),
  scheduledDate: z.string().min(1, 'Scheduled date required'),
  scheduledStartTime: z.string().min(1, 'Start time required'),
  surgeryType: z.enum(['Elective', 'Emergency', 'Day Care']).default('Elective'),
  estimatedDuration: z.number().positive().max(720).default(60),
  surgeonId: cuidSchema.optional(),
  anesthetistId: cuidSchema.optional(),
  assistantIds: z.array(cuidSchema).max(5).optional(),
  notes: z.string().max(2000).optional(),
})

export type CreateOtScheduleInput = z.infer<typeof createOtScheduleSchema>
