'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createProductSchema, updateProductSchema } from '@/lib/validations/product'
import type { CreateProductInput, UpdateProductInput } from '@/lib/validations/product'
import { AppError, requireAdmin, buildPagination } from '@/lib/api-utils'
import { emitLowStockAlert } from '@/lib/server/socket-emit'
import { parseProductsCsv } from '@/lib/product-csv'

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

export async function cloneProduct(id: string) {
  await requireAdmin()

  const source = await prisma.product.findUnique({
    where: { id },
    include: { allowedDimensions: true, allowedQuantities: true },
  })
  if (!source) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND')

  // A clone starts as an inactive draft with no stock: it must be reviewed
  // before it goes live, and it must not inherit the original's sold units.
  return createProduct({
    name: `${source.name} (Copy)`.slice(0, 100),
    slug: `${source.slug}-copy-${Date.now().toString(36)}`.slice(0, 100),
    description: source.description ?? undefined,
    basePrice: Number(source.basePrice),
    compareAtPrice: source.compareAtPrice ? Number(source.compareAtPrice) : undefined,
    categoryId: source.categoryId,
    images: source.images,
    allowedDimensions: source.allowedDimensions.map((d) => ({
      width: d.width,
      height: d.height,
      label: d.label,
      priceMultiplier: Number(d.priceMultiplier),
      isDefault: d.isDefault,
      sortOrder: d.sortOrder,
    })),
    allowedQuantities: source.allowedQuantities.map((q) => ({
      minQty: q.minQty,
      maxQty: q.maxQty ?? undefined,
      pricePerUnit: Number(q.pricePerUnit),
      label: q.label,
      sortOrder: q.sortOrder,
    })),
    customizationOptions: source.customizationOptions as CreateProductInput['customizationOptions'],
    taxPercent: Number(source.taxPercent),
    additionalCharge: Number(source.additionalCharge),
    isTaxInclusive: source.isTaxInclusive,
    trackInventory: source.trackInventory,
    stock: 0,
    lowStockThreshold: source.lowStockThreshold,
    isActive: false,
    isFeatured: false,
    sortOrder: source.sortOrder,
    metaTitle: source.metaTitle ?? undefined,
    metaDescription: source.metaDescription ?? undefined,
  })
}

export interface ProductImportResult {
  created: number
  updated: number
  errors: Array<{ row: number; reason: string }>
}

function productDataPayload(data: CreateProductInput) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description,
    basePrice: data.basePrice,
    compareAtPrice: data.compareAtPrice,
    categoryId: data.categoryId,
    images: data.images,
    customizationOptions: data.customizationOptions,
    taxPercent: data.taxPercent,
    additionalCharge: data.additionalCharge,
    isTaxInclusive: data.isTaxInclusive,
    trackInventory: data.trackInventory,
    stock: data.stock,
    lowStockThreshold: data.lowStockThreshold,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
    sortOrder: data.sortOrder,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
  }
}

function nestedConfigPayload(data: CreateProductInput) {
  return {
    allowedDimensions: {
      create: data.allowedDimensions.map((d) => ({
        width: d.width,
        height: d.height,
        label: d.label,
        priceMultiplier: d.priceMultiplier,
        isDefault: d.isDefault,
        sortOrder: d.sortOrder,
      })),
    },
    allowedQuantities: {
      create: data.allowedQuantities.map((q) => ({
        minQty: q.minQty,
        maxQty: q.maxQty ?? null,
        pricePerUnit: q.pricePerUnit,
        label: q.label,
        sortOrder: q.sortOrder,
      })),
    },
  }
}

/** Import a product CSV, matching rows to existing products by slug. */
export async function importProductsFromCsv(csv: string): Promise<ProductImportResult> {
  await requireAdmin()

  const { rows, errors } = parseProductsCsv(csv)
  const result: ProductImportResult = { created: 0, updated: 0, errors }
  if (rows.length === 0) return result

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } })
  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]))

  for (const row of rows) {
    const categoryId = categoryIdBySlug.get(row.categorySlug)
    if (!categoryId) {
      result.errors.push({ row: row.row, reason: `unknown category "${row.categorySlug}"` })
      continue
    }

    const candidate: CreateProductInput = {
      name: row.name,
      slug: row.slug,
      description: row.description,
      basePrice: row.basePrice,
      compareAtPrice: row.compareAtPrice,
      categoryId,
      images: row.images,
      allowedDimensions: row.dimensions,
      allowedQuantities: row.quantities,
      taxPercent: row.taxPercent,
      additionalCharge: row.additionalCharge,
      isTaxInclusive: row.isTaxInclusive,
      trackInventory: row.trackInventory,
      stock: row.stock,
      lowStockThreshold: row.lowStockThreshold,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      sortOrder: row.sortOrder,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
    }

    // Validate with the same schema the admin form uses, so an import can never
    // write a product the UI would refuse to save.
    const validated = createProductSchema.safeParse(candidate)
    if (!validated.success) {
      const detail = Object.entries(validated.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${(messages ?? []).join(', ')}`)
        .join('; ')
      result.errors.push({ row: row.row, reason: detail || 'invalid row' })
      continue
    }

    const data = validated.data
    const existing = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true } })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...productDataPayload(data),
          allowedDimensions: { deleteMany: {}, ...nestedConfigPayload(data).allowedDimensions },
          allowedQuantities: { deleteMany: {}, ...nestedConfigPayload(data).allowedQuantities },
        },
      })
      result.updated += 1
    } else {
      await createProduct(data)
      result.created += 1
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return result
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

export async function bulkUpdateProducts(
  ids: string[],
  updates: Partial<Record<(typeof BULK_UPDATE_FIELDS)[number], unknown>>
) {
  await requireAdmin()

  // Whitelist updatable fields — never pass raw client objects to updateMany.
  const data: Prisma.ProductUncheckedUpdateManyInput = {}
  const setters: { [K in (typeof BULK_UPDATE_FIELDS)[number]]?: (v: unknown) => void } = {
    isActive: (v) => { data.isActive = v as boolean },
    isFeatured: (v) => { data.isFeatured = v as boolean },
    categoryId: (v) => { data.categoryId = v as string },
    sortOrder: (v) => { data.sortOrder = v as number },
    stock: (v) => { data.stock = v as number },
    trackInventory: (v) => { data.trackInventory = v as boolean },
  }
  for (const field of BULK_UPDATE_FIELDS) {
    const value = updates[field]
    if (value !== undefined && value !== null) setters[field]?.(value)
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

export interface ProductFilters {
  categoryId?: string
  isActive?: boolean
  isFeatured?: boolean
  search?: string
  minPrice?: number | string
  maxPrice?: number | string
  sortBy?: (typeof PRODUCT_SORT_FIELDS)[number]
  sortOrder?: 'asc' | 'desc'
  page?: number | string
  limit?: number | string
}

export async function getProducts(filters: ProductFilters = {}) {
  const where: Prisma.ProductWhereInput = {}

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
  const sortBy = (PRODUCT_SORT_FIELDS as readonly string[]).includes(filters.sortBy ?? '')
    ? (filters.sortBy as (typeof PRODUCT_SORT_FIELDS)[number])
    : 'sortOrder'
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