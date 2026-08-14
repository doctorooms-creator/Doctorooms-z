import { z } from 'zod'
import { NextResponse } from 'next/server'

export * from './common'
export * from './billing'
export * from './lab'
export * from './bed'
export * from './ot'
export * from './inventory'

/**
 * Validate request body against a zod schema.
 * Returns { success: true, data: T } on success.
 * Returns { success: false, error: NextResponse } on failure (422 with details).
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    error: NextResponse.json(
      {
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 422 }
    ),
  }
}
