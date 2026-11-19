import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { escapeCsvCell } from '@/lib/csv'
import { customRequestExportFiltersSchema } from '@/lib/validations/custom-request'

export const dynamic = 'force-dynamic'

function csvEscape(value: unknown): string {
  return escapeCsvCell(value)
}

/** Admin-only custom-request CSV export. */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const sp = new URL(request.url).searchParams
    // Validate at the edge: an unknown status is a 400, not a Prisma error.
    const filters = customRequestExportFiltersSchema.parse({
      status: sp.get('status') || undefined,
      search: sp.get('search') || undefined,
    })

    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { id: { contains: filters.search, mode: 'insensitive' as const } },
              { notes: { contains: filters.search, mode: 'insensitive' as const } },
              { user: { email: { contains: filters.search, mode: 'insensitive' as const } } },
              { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const requests = await prisma.customRequest.findMany({
      where,
      select: {
        id: true,
        status: true,
        width: true,
        height: true,
        quantity: true,
        material: true,
        finish: true,
        cutType: true,
        notes: true,
        adminNotes: true,
        quotedPrice: true,
        quotedAt: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const header = [
      'id',
      'customerName',
      'customerEmail',
      'status',
      'widthCm',
      'heightCm',
      'quantity',
      'material',
      'finish',
      'cutType',
      'quotedPrice',
      'quotedAt',
      'notes',
      'adminNotes',
      'createdAt',
    ]
    const lines = [header.join(',')]
    for (const item of requests) {
      lines.push(
        [
          item.id,
          item.user.name,
          item.user.email,
          item.status,
          item.width,
          item.height,
          item.quantity,
          item.material,
          item.finish,
          item.cutType,
          item.quotedPrice ? Number(item.quotedPrice).toFixed(2) : '',
          item.quotedAt?.toISOString() ?? '',
          item.notes,
          item.adminNotes,
          item.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(',')
      )
    }

    return new Response('﻿' + lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="custom-requests.csv"',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
