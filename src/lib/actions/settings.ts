import type { Prisma } from '@prisma/client'
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { AppError, requireAdmin } from '@/lib/api-utils'
import type { PricingSettings } from '@/lib/pricing'

function parseSettingValue(setting: { value: string; type: string }): string | number | boolean {
  switch (setting.type) {
    case 'NUMBER':
      return parseFloat(setting.value)
    case 'BOOLEAN':
      return setting.value === 'true'
    case 'JSON':
      try {
        return JSON.parse(setting.value)
      } catch {
        return setting.value
      }
    default:
      return setting.value
  }
}

function toKeyValue(settings: { key: string; value: string; type: string }[]) {
  const result: Record<string, string | number | boolean> = {}
  for (const setting of settings) result[setting.key] = parseSettingValue(setting)
  return result
}

export async function getSettings(category?: string) {
  const session = await auth()
  if (!session?.user) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED')

  const where: Prisma.SettingWhereInput = {}
  if (category) where.category = category
  if (session.user.role !== 'ADMIN') where.isPublic = true

  const settings = await prisma.setting.findMany({
    where,
    orderBy: { category: 'asc' },
  })
  return toKeyValue(settings)
}

export async function getSetting(key: string) {
  const session = await auth()

  const setting = await prisma.setting.findUnique({ where: { key } })
  if (!setting) return null

  // Non-public settings require an authenticated admin.
  if (!setting.isPublic) {
    if (!session?.user) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED')
    if (session.user.role !== 'ADMIN') throw new AppError(403, 'Admin access required', 'FORBIDDEN')
  }

  return {
    key: setting.key,
    value: parseSettingValue(setting),
    type: setting.type,
    category: setting.category,
    description: setting.description,
    isPublic: setting.isPublic,
  }
}

/** Normalized pricing/delivery settings used by the pricing engine. Public (no auth). */
export async function getPricingSettings(): Promise<PricingSettings> {
  const settings = await prisma.setting.findMany({ where: { isPublic: true } })
  const kv = toKeyValue(settings)
  const num = (k: string, dflt: number) => {
    const v = Number(kv[k])
    return Number.isFinite(v) ? v : dflt
  }
  return {
    globalTaxPercent: num('global_tax_percent', 5),
    taxInclusivePricing: kv['tax_inclusive_pricing'] === true,
    insideDhakaCharge: num('delivery_inside_dhaka_charge', 60),
    outsideDhakaCharge: num('delivery_outside_dhaka_charge', 120),
    freeDeliveryThreshold: num('free_delivery_threshold', 2000),
  }
}

export async function updateSetting(data: { key: string; value: string; type: string; category: string; description?: string; isPublic?: boolean }) {
  await requireAdmin()

  const setting = await prisma.setting.upsert({
    where: { key: data.key },
    update: {
      value: data.value,
      type: data.type,
      category: data.category,
      description: data.description,
    },
    create: {
      key: data.key,
      value: data.value,
      type: data.type,
      category: data.category,
      description: data.description,
    },
  })

  revalidatePath('/admin/settings')
  return { success: true, setting }
}

export async function updateSettings(settings: Record<string, string | number | boolean>) {
  await requireAdmin()

  const updates = Object.entries(settings).map(([key, value]) => {
    let type: string
    let stringValue: string

    if (typeof value === 'boolean') {
      type = 'BOOLEAN'
      stringValue = value.toString()
    } else if (typeof value === 'number') {
      type = 'NUMBER'
      stringValue = value.toString()
    } else if (typeof value === 'object') {
      type = 'JSON'
      stringValue = JSON.stringify(value)
    } else {
      type = 'STRING'
      stringValue = String(value)
    }

    return prisma.setting.upsert({
      where: { key },
      update: { value: stringValue, type },
      create: { key, value: stringValue, type, category: 'GENERAL' },
    })
  })

  await prisma.$transaction(updates)
  revalidatePath('/admin/settings')
  return { success: true }
}

export async function getPublicSettings() {
  const settings = await prisma.setting.findMany({
    where: { isPublic: true },
  })
  return toKeyValue(settings)
}

export async function getSettingByCategory(category: string) {
  const session = await auth()
  if (!session?.user) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED')

  const where: Prisma.SettingWhereInput = { category }
  if (session.user.role !== 'ADMIN') where.isPublic = true

  const settings = await prisma.setting.findMany({
    where,
    orderBy: { key: 'asc' },
  })
  return toKeyValue(settings)
}

export async function initializeDefaultSettings() {
  await requireAdmin()
  const defaults = [
    // Tax Settings
    { key: 'global_tax_percent', value: '5', type: 'NUMBER', category: 'TAX', description: 'Global tax percentage applied to all products', isPublic: true },
    { key: 'tax_inclusive_pricing', value: 'false', type: 'BOOLEAN', category: 'TAX', description: 'Whether product prices include tax', isPublic: true },

    // Delivery Settings
    { key: 'delivery_enabled', value: 'true', type: 'BOOLEAN', category: 'DELIVERY', description: 'Enable/disable delivery service', isPublic: true },
    { key: 'delivery_inside_dhaka_charge', value: '60', type: 'NUMBER', category: 'DELIVERY', description: 'Delivery charge inside Dhaka (BDT)', isPublic: true },
    { key: 'delivery_outside_dhaka_charge', value: '120', type: 'NUMBER', category: 'DELIVERY', description: 'Delivery charge outside Dhaka (BDT)', isPublic: true },
    { key: 'free_delivery_threshold', value: '2000', type: 'NUMBER', category: 'DELIVERY', description: 'Order amount for free delivery (BDT)', isPublic: true },
    { key: 'delivery_days_inside_dhaka', value: '2-3', type: 'STRING', category: 'DELIVERY', description: 'Estimated delivery days inside Dhaka', isPublic: true },
    { key: 'delivery_days_outside_dhaka', value: '3-5', type: 'STRING', category: 'DELIVERY', description: 'Estimated delivery days outside Dhaka', isPublic: true },

    // General Settings
    { key: 'site_name', value: 'bioscope', type: 'STRING', category: 'GENERAL', description: 'Site name displayed in header and emails', isPublic: true },
    { key: 'site_currency', value: 'BDT', type: 'STRING', category: 'GENERAL', description: 'Default currency code', isPublic: true },
    { key: 'contact_email', value: 'support@stickershop.com', type: 'STRING', category: 'GENERAL', description: 'Contact email for customer inquiries', isPublic: true },
    { key: 'contact_phone', value: '+8801700000000', type: 'STRING', category: 'GENERAL', description: 'Contact phone number', isPublic: true },
    { key: 'custom_request_enabled', value: 'true', type: 'BOOLEAN', category: 'GENERAL', description: 'Allow customers to submit custom sticker requests', isPublic: true },
    { key: 'custom_request_min_quantity', value: '10', type: 'NUMBER', category: 'GENERAL', description: 'Minimum quantity for custom requests', isPublic: true },
    { key: 'custom_request_max_dimension_cm', value: '30', type: 'NUMBER', category: 'GENERAL', description: 'Maximum dimension (width or height) in cm for custom requests', isPublic: true },

    // Email Settings
    { key: 'smtp_host', value: '', type: 'STRING', category: 'EMAIL', description: 'SMTP server host' },
    { key: 'smtp_port', value: '587', type: 'NUMBER', category: 'EMAIL', description: 'SMTP server port' },
    { key: 'smtp_user', value: '', type: 'STRING', category: 'EMAIL', description: 'SMTP username' },
    { key: 'smtp_password', value: '', type: 'STRING', category: 'EMAIL', description: 'SMTP password' },
    { key: 'from_email', value: '', type: 'STRING', category: 'EMAIL', description: 'From email address' },
    { key: 'from_name', value: 'bioscope', type: 'STRING', category: 'EMAIL', description: 'From name' },
  ]

  for (const setting of defaults) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  return { success: true }
}