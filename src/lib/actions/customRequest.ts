'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { submitCustomRequestSchema, priceCustomRequestSchema, updateCustomRequestStatusSchema } from '@/lib/validations/custom-request'
import { AppError, requireUser, requireAdmin, buildPagination } from '@/lib/api-utils'
import { emitCustomRequestSubmitted, emitCustomRequestPriced, emitNotificationNew } from '@/lib/server/socket-emit'

const CR_SORT_FIELDS = ['createdAt', 'status', 'quantity', 'quotedPrice'] as const

export async function submitCustomRequest(data: any) {
  const sessionUser = await requireUser()

  const validated = submitCustomRequestSchema.parse(data)

  // Enforce public custom-request settings (enabled, min qty, max dimension)
  const publicSettings = await prisma.setting.findMany({ where: { isPublic: true } })
  const kv: Record<string, any> = {}
  for (const s of publicSettings) {
    if (s.type === 'NUMBER') kv[s.key] = parseFloat(s.value)
    else if (s.type === 'BOOLEAN') kv[s.key] = s.value === 'true'
    else kv[s.key] = s.value
  }
  if (kv['custom_request_enabled'] === false) {
    throw new AppError(403, 'Custom sticker requests are currently disabled', 'DISABLED')
  }
  const minQty = Number(kv['custom_request_min_quantity'] ?? 10)
  if (validated.quantity < minQty) {
    throw new AppError(400, `Minimum quantity for custom requests is ${minQty}`, 'MIN_QUANTITY')
  }
  const maxDim = Number(kv['custom_request_max_dimension_cm'] ?? 30)
  if (validated.width > maxDim || validated.height > maxDim) {
    throw new AppError(400, `Maximum dimension is ${maxDim} cm`, 'MAX_DIMENSION')
  }

  const customRequest = await prisma.customRequest.create({
    data: {
      userId: sessionUser.id,
      imageUrl: validated.imageUrl,
      originalName: validated.originalName,
      width: validated.width,
      height: validated.height,
      quantity: validated.quantity,
      material: validated.material,
      finish: validated.finish,
      cutType: validated.cutType,
      notes: validated.notes,
      status: 'PENDING',
    },
  })

  // Emit real-time event
  await emitCustomRequestSubmitted(customRequest)

  // Create notification for admins
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  const notifications = await Promise.all(admins.map((admin) =>
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'CUSTOM_REQUEST',
        title: 'New Custom Sticker Request',
        message: `${sessionUser.name || 'A customer'} submitted a custom sticker request`,
        data: { requestId: customRequest.id, url: `/admin/custom-requests/${customRequest.id}` },
      },
    })
  ))
  await Promise.all(notifications.map((n) => emitNotificationNew(n)))

  revalidatePath('/admin/custom-requests')
  revalidatePath('/custom-sticker')

  return { success: true, customRequest }
}

export async function updateCustomRequestStatus(id: string, data: any) {
  await requireAdmin()

  const validated = updateCustomRequestStatusSchema.parse(data)

  const customRequest = await prisma.customRequest.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!customRequest) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')

  const updateData: any = {
    status: validated.status,
    adminNotes: validated.adminNotes,
  }

  if (validated.status === 'PRICED' && validated.quotedPrice) {
    updateData.quotedPrice = validated.quotedPrice
    updateData.quotedAt = new Date()
  }

  const updatedRequest = await prisma.customRequest.update({
    where: { id },
    data: updateData,
    include: { user: true },
  })

  // Emit real-time event if priced
  if (validated.status === 'PRICED' && validated.quotedPrice) {
    await emitCustomRequestPriced(updatedRequest)

    // Notify customer
    const notification = await prisma.notification.create({
      data: {
        userId: customRequest.userId,
        type: 'CUSTOM_REQUEST_PRICED',
        title: 'Custom Request Priced',
        message: `Your custom sticker request has been priced at ${validated.quotedPrice} BDT`,
        data: { requestId: id, quotedPrice: validated.quotedPrice, url: `/custom-sticker` },
      },
    })
    await emitNotificationNew(notification)
  }

  revalidatePath('/admin/custom-requests')
  revalidatePath(`/custom-sticker`)

  return { success: true, customRequest: updatedRequest }
}

export async function priceCustomRequest(id: string, data: any) {
  await requireAdmin()

  const validated = priceCustomRequestSchema.parse(data)

  const customRequest = await prisma.customRequest.findUnique({
    where: { id },
    include: { user: true },
  })
  if (!customRequest) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')

  const updatedRequest = await prisma.customRequest.update({
    where: { id },
    data: {
      status: 'PRICED',
      quotedPrice: validated.quotedPrice,
      adminNotes: validated.adminNotes,
      quotedAt: new Date(),
    },
    include: { user: true },
  })

  // Emit real-time event
  await emitCustomRequestPriced(updatedRequest)

  // Notify customer
  const notification = await prisma.notification.create({
    data: {
      userId: customRequest.userId,
      type: 'CUSTOM_REQUEST_PRICED',
      title: 'Custom Request Priced',
      message: `Your custom sticker request has been priced at ${validated.quotedPrice} BDT`,
      data: { requestId: id, quotedPrice: validated.quotedPrice, url: `/custom-sticker` },
    },
  })
  await emitNotificationNew(notification)

  revalidatePath('/admin/custom-requests')
  revalidatePath('/custom-sticker')

  return { success: true, customRequest: updatedRequest }
}

export async function getCustomRequests(filters: any = {}) {
  const sessionUser = await requireUser()

  const where: any = {}

  if (sessionUser.role !== 'ADMIN') {
    where.userId = sessionUser.id
  } else if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.status) where.status = filters.status
  if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) }
  if (filters.endDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) }
  if (filters.search) {
    where.OR = [
      { originalName: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20))
  const sortBy = CR_SORT_FIELDS.includes(filters.sortBy) ? filters.sortBy : 'createdAt'
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc'

  const [requests, total] = await Promise.all([
    prisma.customRequest.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        order: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customRequest.count({ where }),
  ])

  return { data: requests, pagination: buildPagination(page, limit, total) }
}

export async function getCustomRequestById(id: string) {
  const sessionUser = await requireUser()

  const where: any = { id }
  if (sessionUser.role !== 'ADMIN') where.userId = sessionUser.id

  const request = await prisma.customRequest.findUnique({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      order: true,
    },
  })
  if (!request) throw new AppError(404, 'Custom request not found', 'NOT_FOUND')
  return request
}

export async function getCustomRequestStats() {
  await requireAdmin()

  const [total, pending, priced, completed] = await Promise.all([
    prisma.customRequest.count(),
    prisma.customRequest.count({ where: { status: 'PENDING' } }),
    prisma.customRequest.count({ where: { status: 'PRICED' } }),
    prisma.customRequest.count({ where: { status: 'ORDERED' } }),
  ])

  return { total, pending, priced, completed }
}

export async function deleteCustomRequest(id: string) {
  await requireAdmin()

  await prisma.customRequest.delete({ where: { id } })
  revalidatePath('/admin/custom-requests')
  return { success: true }
}