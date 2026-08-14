import { z } from 'zod/v4'
import { cuidSchema } from './common'

export const createBedTransferSchema = z.object({
  admissionId: cuidSchema,
  toBedId: cuidSchema,
  transferReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export type CreateBedTransferInput = z.infer<typeof createBedTransferSchema>
