'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createProductSchema, updateProductSchema } from '@/lib/validations/product'
import type { CreateProductInput, UpdateProductInput } from '@/lib/validations/product'
import { AppError, requireAdmin, buildPagination } from '@/lib/api-utils'
import { emitLowStockAlert } from '@/lib/server/socket-emit'

const PRODUCT_SORT_FIELDS = ['createdAt', 'name', 'basePrice', 'stock', 'sortOrder', 'isActive'] as const

export async function createProduct(data: CreateProductInput) {
  await requireAdmin()
  const validated = createProductSchema.parse(data)

  const product = await prisma.product.create({
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      basePrice: validated.basePrice,
      compareAtPrice: validated.compareAtPrice,
      categoryId: validated.categoryId,
      images: validated.images,
      customizationOptions: validated.customizationOptions,
      taxPercent: validated.taxPercent,
      additionalCharge: validated.additionalCharge,
      isTaxInclusive: validated.isTaxInclusive,
      trackInventory: validated.trackInventory,
      stock: validated.stock,
      lowStockThreshold: validated.lowStockThreshold,
      isActive: validated.isActive,
      isFeatured: validated.isFeatured,
      sortOrder: validated.sortOrder,
      metaTitle: validated.metaTitle,
      metaDescription: validated.metaDescription,
      allowedDimensions: {
        create: validated.allowedDimensions.map((d) => ({
          width: d.width,
          height: d.height,
          label: d.label,
          priceMultiplier: d.priceMultiplier,
          isDefault: d.isDefault,
          sortOrder: d.sortOrder,
        })),
      },
      allowedQuantities: {
        create: validated.allowedQuantities.map((q) => ({
          minQty: q.minQty,
          maxQty: q.maxQty,
          pricePerUnit: q.pricePerUnit,
          label: q.label,
          sortOrder: q.sortOrder,
        })),
      },
    },
  })

  revalidatePath('/admin/products')
  revalidatePath('/shop')

  if (product.trackInventory && product.stock <= product.lowStockThreshold) {
    await emitLowStockAlert(product)
  }

  return { success: true, product }
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  await requireAdmin()
  const validated = updateProductSchema.parse(data)

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'Product not found', 'NOT_FOUND')

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        categoryId: validated.categoryId,
        images: validated.images,
        customizationOptions: validated.customizationOptions,
        taxPercent: validated.taxPercent,
        additionalCharge: validated.additionalCharge,
        isTaxInclusive: validated.isTaxInclusive,
        trackInventory: validated.trackInventory,
        stock: validated.stock,
        lowStockThreshold: validated.lowStockThreshold,
        isActive: validated.isActive,
        isFeatured: validated.isFeatured,
        sortOrder: validated.sortOrder,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
      },
    })

    if (validated.allowedDimensions) {
      await tx.dimensionConfig.deleteMany({ where: { productId: id } })
      if (validated.allowedDimensions.length > 0) {
        await tx.dimensionConfig.createMany({
          data: validated.allowedDimensions.map((d) => ({
            productId: id,
            width: d.width,
            height: d.height,
            label: d.label,
            priceMultiplier: d.priceMultiplier,
            isDefault: d.isDefault,
            sortOrder: d.sortOrder,
          })),
        })
      }
    }

    if (validated.allowedQuantities) {
      await tx.quantityConfig.deleteMany({ where: { productId: id } })
      if (validated.allowedQuantities.length > 0) {
        await tx.quantityConfig.createMany({
          data: validated.allowedQuantities.map((q) => ({
            productId: id,
            minQty: q.minQty,
            maxQty: q.maxQty,
            pricePerUnit: q.pricePerUnit,
            label: q.label,
            sortOrder: q.sortOrder,
          })),
        })
      }
    }

    return updated
  })

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  revalidatePath(`/shop/${product.slug}`)

  if (product.trackInventory && product.stock <= product.lowStockThreshold) {
    await emitLowStockAlert(product)
  }

  return { success: true, product }
}

export async function deleteProduct(id: string) {
  await requireAdmin()

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true, cartItems: true } } },
  })
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND')
  if (product._count.orderItems > 0) {
    throw new AppError(409, 'Product has existing orders — deactivate it instead of deleting', 'HAS_ORDERS')
  }

  await prisma.product.delete({ where: { id } })
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true }
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin()
  const product = await prisma.product.update({
    where: { id },
    data: { isActive },
  })
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, product }
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  await requireAdmin()
  const product = await prisma.product.update({
    where: { id },
    data: { isFeatured },
  })
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, product }
}

const BULK_UPDATE_FIELDS = ['isActive', 'isFeatured', 'categoryId', 'sortOrder', 'stock', 'trackInventory'] as const

export async function bulkUpdateProducts(ids: string[], updates: Partial<any>) {
  await requireAdmin()

  // Whitelist updatable fields — never pass raw client objects to updateMany.
  const data: Record<string, any> = {}
  for (const field of BULK_UPDATE_FIELDS) {
    if (updates[field] !== undefined) data[field] = updates[field]
  }
  if (Object.keys(data).length === 0) throw new AppError(400, 'No valid fields to update', 'EMPTY_UPDATE')

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data,
  })
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, count: result.count }
}

export async function getProducts(filters: any = {}) {
  const where: any = {}

  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.isActive !== undefined) where.isActive = filters.isActive
  if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { slug: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 12))
  const sortBy = PRODUCT_SORT_FIELDS.includes(filters.sortBy) ? filters.sortBy : 'sortOrder'
  const sortOrder = filters.sortOrder === 'desc' ? 'desc' : 'asc'

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        allowedDimensions: true,
        allowedQuantities: true,
        _count: { select: { reviews: true, orderItems: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return { data: products, pagination: buildPagination(page, limit, total) }
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      allowedDimensions: { orderBy: { sortOrder: 'asc' } },
      allowedQuantities: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { allowedDimensions: true, allowedQuantities: true },
    orderBy: { sortOrder: 'asc' },
    take: limit,
  })
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      categoryId,
      isActive: true,
    },
    include: { allowedDimensions: true, allowedQuantities: true },
    orderBy: { sortOrder: 'asc' },
    take: limit,
  })
}