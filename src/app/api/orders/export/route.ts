import { handleRouteError, requireAdmin } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { escapeCsvCell } from '@/lib/csv'
import { orderExportFiltersSchema } from '@/lib/validations/order'

export const dynamic = 'force-dynamic'

function csvEscape(value: unknown): string {
  return escapeCsvCell(value)
}

/** Admin-only order CSV export (honours the list filters). */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const sp = new URL(request.url).searchParams
    // Validate at the edge: an unknown status or malformed date is a 400,
    // not a Prisma runtime error deep in the query.
    const filters = orderExportFiltersSchema.parse({
      status: sp.get('status') || undefined,
      search: sp.get('search') || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo: sp.get('dateTo') || undefined,
    })

    const where = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNumber: { contains: filters.search, mode: 'insensitive' as const } },
              { shippingName: { contains: filters.search, mode: 'insensitive' as const } },
              { user: { email: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        subtotal: true,
        taxAmount: true,
        deliveryCharge: true,
        discountAmount: true,
        total: true,
        currency: true,
        shippingName: true,
        shippingPhone: true,
        shippingCity: true,
        shippingDistrict: true,
        createdAt: true,
        user: { select: { email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    const header = [
      'orderNumber',
      'status',
      'paymentMethod',
      'paymentStatus',
      'subtotal',
      'taxAmount',
      'deliveryCharge',
      'discountAmount',
      'total',
      'currency',
      'customerEmail',
      'shippingName',
      'shippingPhone',
      'shippingCity',
      'shippingDistrict',
      'itemCount',
      'createdAt',
    ]
    const lines = [header.join(',')]
    for (const order of orders) {
      lines.push(
        [
          order.orderNumber,
          order.status,
          order.paymentMethod,
          order.paymentStatus,
          Number(order.subtotal).toFixed(2),
          Number(order.taxAmount).toFixed(2),
          Number(order.deliveryCharge).toFixed(2),
          Number(order.discountAmount).toFixed(2),
          Number(order.total).toFixed(2),
          order.currency,
          order.user.email,
          order.shippingName,
          order.shippingPhone,
          order.shippingCity,
          order.shippingDistrict,
          order._count.items,
          order.createdAt.toISOString(),
        ]
          .map(csvEscape)
          .join(',')
      )
    }

    return new Response('﻿' + lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="orders.csv"',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
