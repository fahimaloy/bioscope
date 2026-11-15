import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { handleRouteError, ok, created, parsePagination, buildPagination, requireAdmin } from '@/lib/api-utils'
import { createCategorySchema } from '@/lib/validations/category'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const session = await auth()
    const isAdmin = session?.user?.role === 'ADMIN'
    const { page, limit } = parsePagination(url, { limit: 50, sortOrder: 'asc' })

    const where: any = {}
    if (!isAdmin) where.isActive = true
    else if (url.searchParams.get('isActive') !== null) where.isActive = url.searchParams.get('isActive') === 'true'
    const search = url.searchParams.get('search')
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }]

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where }),
    ])
    return ok({ data: categories, pagination: buildPagination(page, limit, total) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const validated = createCategorySchema.parse(body)
    const category = await prisma.category.create({ data: validated })
    return created({ category })
  } catch (error) {
    return handleRouteError(error)
  }
}
