import { z } from 'zod/v4'
import { NextResponse } from 'next/server'

// Re-export all schemas
export * from './common'
export * from './billing'
export * from './ipd-admission'
export * from './lab'
export * from './bed'
export * from './ot'
export * from './inventory'
export * from './charge-master'

/** Validate request body against a Zod schema. Returns parsed data or error response. */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; error: NextResponse } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const details = result.error.issues.map((issue) => ({
    field: String(issue.path.join('.')),
    message: issue.message,
  }))
  return {
    success: false,
    error: NextResponse.json(
      { error: 'Validation failed', details },
      { status: 422 }
    ),
  }
}
