// Shared API helpers for route handlers and server actions. Server-only.
import { NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Map any thrown error to a consistent JSON error response. */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', code: 'VALIDATION', details: error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code, details: error.details },
      { status: error.status }
    )
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'A record with this value already exists', code: 'P2002' }, { status: 409 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Record not found', code: 'P2025' }, { status: 404 })
    }
  }
  console.error('[api] unexpected error:', error)
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
}

/** Require an authenticated user (route handlers + server actions). */
export async function requireUser() {
  const session = await auth()
  if (!session?.user) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED')
  return session.user
}

/** Require an admin user (route handlers + server actions). */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new AppError(403, 'Admin access required', 'FORBIDDEN')
  return user
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/** Parse ?page&limit&sortOrder from a request URL with safe defaults. */
export function parsePagination(url: URL, defaults?: { limit?: number; sortOrder?: 'asc' | 'desc' }) {
  const sp = url.searchParams
  const result = paginationSchema.safeParse({
    page: sp.get('page') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    sortOrder: sp.get('sortOrder') ?? undefined,
  })
  const parsed = result.success ? result.data : { page: 1, limit: defaults?.limit ?? 20, sortOrder: defaults?.sortOrder ?? 'desc' as const }
  if (!result.success && defaults?.limit) parsed.limit = defaults.limit
  return parsed
}

export function buildPagination(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json({ success: true, data }, init)
export const created = <T>(data: T) => NextResponse.json({ success: true, data }, { status: 201 })
