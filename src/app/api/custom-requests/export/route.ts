import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Admin-only custom-request CSV export. */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const sp = new URL(request.url).searchParams
    const status = sp.get('status') ?? undefined
    const search = sp.get('search') ?? undefined

    const where = {
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' as const } },
              { notes: { contains: search, mode: 'insensitive' as const } },
              { user: { email: { contains: search, mode: 'insensitive' as const } } },
              { user: { name: { contains: search, mode: 'insensitive' as const } } },
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
