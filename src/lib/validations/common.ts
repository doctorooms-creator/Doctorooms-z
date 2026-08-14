import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
})

export const cuidSchema = z.string().min(1, 'Required')

export function parsePagination(searchParams: URLSearchParams) {
  return paginationSchema.parse(Object.fromEntries(searchParams))
}

export type PaginationInput = z.infer<typeof paginationSchema>
