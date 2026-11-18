import { PrismaClient, UserRole, OrderStatus, DeliveryZone, PaymentMethod, PaymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Safety guard: refuse to wipe a database that looks like production.
  const dbUrl = process.env.DATABASE_URL || ''
  const isLocal = /localhost|127\.0\.0\.1/.test(dbUrl)
  if (!isLocal && process.env.SEED_ALLOW_REMOTE !== '1') {
    console.error('❌ Refusing to seed a non-local database. Set SEED_ALLOW_REMOTE=1 to override.')
    process.exit(1)
  }
  if (process.env.SEED_CONFIRM !== 'yes') {
    console.error('❌ Destructive seed: set SEED_CONFIRM=yes to proceed (all tables are wiped).')
    process.exit(1)
  }
  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.notification.deleteMany()
  await prisma.review.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.cart.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customRequest.deleteMany()
  await prisma.quantityConfig.deleteMany()
  await prisma.dimensionConfig.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()
  await prisma.setting.deleteMany()

  console.log('🧹 Cleared existing data')

  // Create admin user — password from SEED_ADMIN_PASSWORD or generated (printed once, never hardcoded).
  const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex')
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@stickershop.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      phone: '+8801700000000',
      emailVerified: new Date(),
    },
  })
  console.log('👤 Created admin user:', admin.email)
  console.log('🔑 Admin password (shown once):', adminPasswordPlain)

  const customerPasswordPlain = process.env.SEED_CUSTOMER_PASSWORD || crypto.randomBytes(12).toString('hex')
  const customerPassword = await bcrypt.hash(customerPasswordPlain, 12)
  const customer = await prisma.user.create({
    data: {
      email: 'customer@stickershop.com',
      passwordHash: customerPassword,
      name: 'Test Customer',
      role: UserRole.CUSTOMER,
      phone: '+8801800000000',
      emailVerified: new Date(),
    },
  })
  console.log('👤 Created customer user:', customer.email)
  console.log('🔑 Customer password (shown once):', customerPasswordPlain)

  // Create customer address
  await prisma.address.create({
    data: {
      userId: customer.id,
      name: 'Test Customer',
      phone: '+8801800000000',
      addressLine1: 'House 123, Road 45',
      addressLine2: 'Block A',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1207',
      country: 'Bangladesh',
      isDefault: true,
      deliveryZone: DeliveryZone.INSIDE_DHAKA,
    },
  })
  console.log('📍 Created customer address')

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Vinyl Stickers',
        slug: 'vinyl-stickers',
        description: 'Durable vinyl stickers for indoor and outdoor use',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Paper Stickers',
        slug: 'paper-stickers',
        description: 'Affordable paper stickers for packaging and labels',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Holographic Stickers',
        slug: 'holographic-stickers',
        description: 'Eye-catching holographic and iridescent stickers',
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Clear Stickers',
        slug: 'clear-stickers',
        description: 'Transparent stickers for a seamless look',
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Custom Shapes',
        slug: 'custom-shapes',
        description: 'Die-cut stickers in any shape you imagine',
        isActive: true,
        sortOrder: 5,
      },
    }),
  ])
  console.log('📂 Created categories:', categories.map(c => c.name).join(', '))

  // Create sample products
  const vinylCategory = categories[0]
  const paperCategory = categories[1]
  const holoCategory = categories[2]

  const products = await Promise.all([
    // Vinyl Stickers
    prisma.product.create({
      data: {
        name: 'Custom Logo Vinyl Sticker',
        slug: 'custom-logo-vinyl-sticker',
        description: 'High-quality vinyl stickers with your custom logo. Weatherproof and durable for indoor/outdoor use.',
        basePrice: 150.00,
        compareAtPrice: 200.00,
        images: [
          '/images/sticker-placeholder.svg',
          '/images/sticker-placeholder.svg',
        ],
        categoryId: vinylCategory.id,
        customizationOptions: {
          materials: ['white_vinyl', 'clear_vinyl'],
          finishes: ['matte', 'glossy'],
          cutTypes: ['kiss_cut', 'die_cut'],
        },
        taxPercent: 5.00,
        additionalCharge: 0,
        isTaxInclusive: false,
        trackInventory: true,
        stock: 500,
        lowStockThreshold: 50,
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
        metaTitle: 'Custom Logo Vinyl Stickers - Weatherproof & Durable',
        metaDescription: 'Create custom vinyl stickers with your logo. Weatherproof, durable, and perfect for branding.',
        allowedDimensions: {
          create: [
            { width: 5, height: 5, label: 'Small (5x5 cm)', priceMultiplier: 1.0, isDefault: true, sortOrder: 1 },
            { width: 7, height: 7, label: 'Medium (7x7 cm)', priceMultiplier: 1.5, sortOrder: 2 },
            { width: 10, height: 10, label: 'Large (10x10 cm)', priceMultiplier: 2.0, sortOrder: 3 },
            { width: 15, height: 10, label: 'Rectangle (15x10 cm)', priceMultiplier: 2.5, sortOrder: 4 },
          ],
        },
        allowedQuantities: {
          create: [
            { minQty: 1, maxQty: 10, pricePerUnit: 150.00, label: '1-10 pcs', sortOrder: 1 },
            { minQty: 11, maxQty: 50, pricePerUnit: 120.00, label: '11-50 pcs', sortOrder: 2 },
            { minQty: 51, maxQty: 100, pricePerUnit: 100.00, label: '51-100 pcs', sortOrder: 3 },
            { minQty: 101, maxQty: null, pricePerUnit: 80.00, label: '100+ pcs', sortOrder: 4 },
          ],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Waterproof Bottle Stickers',
        slug: 'waterproof-bottle-stickers',
        description: 'Dishwasher-safe vinyl stickers perfect for water bottles, laptops, and gear.',
        basePrice: 120.00,
        compareAtPrice: 160.00,
        images: [
          '/images/sticker-placeholder.svg',
        ],
        categoryId: vinylCategory.id,
        customizationOptions: {
          materials: ['white_vinyl'],
          finishes: ['matte', 'glossy'],
          cutTypes: ['die_cut'],
        },
        taxPercent: 5.00,
        additionalCharge: 0,
        isTaxInclusive: false,
        trackInventory: true,
        stock: 300,
        lowStockThreshold: 30,
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
        allowedDimensions: {
          create: [
            { width: 6, height: 6, label: 'Standard (6x6 cm)', priceMultiplier: 1.0, isDefault: true, sortOrder: 1 },
            { width: 8, height: 8, label: 'Large (8x8 cm)', priceMultiplier: 1.3, sortOrder: 2 },
          ],
        },
        allowedQuantities: {
          create: [
            { minQty: 1, maxQty: 20, pricePerUnit: 120.00, label: '1-20 pcs', sortOrder: 1 },
            { minQty: 21, maxQty: 100, pricePerUnit: 90.00, label: '21-100 pcs', sortOrder: 2 },
            { minQty: 101, maxQty: null, pricePerUnit: 70.00, label: '100+ pcs', sortOrder: 3 },
          ],
        },
      },
    }),
    // Paper Stickers
    prisma.product.create({
      data: {
        name: 'Kraft Paper Label Stickers',
        slug: 'kraft-paper-label-stickers',
        description: 'Eco-friendly kraft paper stickers perfect for product packaging and handmade goods.',
        basePrice: 80.00,
        compareAtPrice: 110.00,
        images: [
          '/images/sticker-placeholder.svg',
        ],
        categoryId: paperCategory.id,
        customizationOptions: {
          materials: ['kraft_paper', 'white_paper'],
          finishes: ['matte'],
          cutTypes: ['kiss_cut', 'die_cut'],
        },
        taxPercent: 5.00,
        additionalCharge: 0,
        isTaxInclusive: false,
        trackInventory: true,
        stock: 1000,
        lowStockThreshold: 100,
        isActive: true,
        isFeatured: false,
        sortOrder: 3,
        allowedDimensions: {
          create: [
            { width: 4, height: 4, label: 'Small (4x4 cm)', priceMultiplier: 1.0, isDefault: true, sortOrder: 1 },
            { width: 6, height: 4, label: 'Rectangle (6x4 cm)', priceMultiplier: 1.2, sortOrder: 2 },
            { width: 8, height: 5, label: 'Large Rectangle (8x5 cm)', priceMultiplier: 1.5, sortOrder: 3 },
          ],
        },
        allowedQuantities: {
          create: [
            { minQty: 50, maxQty: 100, pricePerUnit: 80.00, label: '50-100 pcs', sortOrder: 1 },
            { minQty: 101, maxQty: 500, pricePerUnit: 60.00, label: '101-500 pcs', sortOrder: 2 },
            { minQty: 501, maxQty: null, pricePerUnit: 45.00, label: '500+ pcs', sortOrder: 3 },
          ],
        },
      },
    }),
    // Holographic Stickers
    prisma.product.create({
      data: {
        name: 'Holographic Sparkle Stickers',
        slug: 'holographic-sparkle-stickers',
        description: 'Mesmerizing holographic stickers that shift colors in the light. Perfect for branding that pops.',
        basePrice: 200.00,
        compareAtPrice: 280.00,
        images: [
          '/images/sticker-placeholder.svg',
          '/images/sticker-placeholder.svg',
        ],
        categoryId: holoCategory.id,
        customizationOptions: {
          materials: ['holographic_vinyl'],
          finishes: ['glossy'],
          cutTypes: ['die_cut', 'kiss_cut'],
        },
        taxPercent: 5.00,
        additionalCharge: 20.00, // Premium material surcharge
        isTaxInclusive: false,
        trackInventory: true,
        stock: 100,
        lowStockThreshold: 10,
        isActive: true,
        isFeatured: true,
        sortOrder: 4,
        allowedDimensions: {
          create: [
            { width: 5, height: 5, label: 'Small (5x5 cm)', priceMultiplier: 1.0, isDefault: true, sortOrder: 1 },
            { width: 7, height: 7, label: 'Medium (7x7 cm)', priceMultiplier: 1.6, sortOrder: 2 },
            { width: 10, height: 10, label: 'Large (10x10 cm)', priceMultiplier: 2.5, sortOrder: 3 },
          ],
        },
        allowedQuantities: {
          create: [
            { minQty: 1, maxQty: 10, pricePerUnit: 200.00, label: '1-10 pcs', sortOrder: 1 },
            { minQty: 11, maxQty: 50, pricePerUnit: 170.00, label: '11-50 pcs', sortOrder: 2 },
            { minQty: 51, maxQty: null, pricePerUnit: 150.00, label: '50+ pcs', sortOrder: 3 },
          ],
        },
      },
    }),
  ])
  console.log('🏷️ Created products:', products.map(p => p.name).join(', '))

  // Create sample order
  const product = products[0]
  const dimension = await prisma.dimensionConfig.findFirst({ where: { productId: product.id, isDefault: true } })
  const quantityConfig = await prisma.quantityConfig.findFirst({ where: { productId: product.id, minQty: 1 } })

  if (dimension && quantityConfig) {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-001',
        userId: customer.id,
        status: OrderStatus.DELIVERED,
        subtotal: 150.00,
        taxAmount: 7.50,
        deliveryCharge: 60.00,
        discountAmount: 0,
        total: 217.50,
        currency: 'BDT',
        shippingName: 'Test Customer',
        shippingPhone: '+8801800000000',
        shippingAddress: 'House 123, Road 45, Block A',
        shippingCity: 'Dhaka',
        shippingDistrict: 'Dhaka',
        shippingDivision: 'Dhaka',
        shippingPostalCode: '1207',
        deliveryZone: DeliveryZone.INSIDE_DHAKA,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PAID,
        deliveredAt: new Date('2024-01-15'),
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            productImage: product.images[0],
            width: dimension.width,
            height: dimension.height,
            quantity: 1,
            unitPrice: quantityConfig.pricePerUnit,
            totalPrice: quantityConfig.pricePerUnit,
            taxPercent: product.taxPercent,
            taxAmount: 7.50,
          },
        },
      },
    })
    console.log('📦 Created sample order:', order.orderNumber)
  }

  // Create settings
  const settings = await Promise.all([
    // Tax settings
    prisma.setting.create({
      data: {
        key: 'global_tax_percent',
        value: '5',
        type: 'NUMBER',
        category: 'TAX',
        description: 'Global tax percentage applied to all products',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'tax_inclusive_pricing',
        value: 'false',
        type: 'BOOLEAN',
        category: 'TAX',
        description: 'Whether product prices include tax',
        isPublic: true,
      },
    }),
    // Delivery settings
    prisma.setting.create({
      data: {
        key: 'delivery_enabled',
        value: 'true',
        type: 'BOOLEAN',
        category: 'DELIVERY',
        description: 'Enable/disable delivery service',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'delivery_inside_dhaka_charge',
        value: '60',
        type: 'NUMBER',
        category: 'DELIVERY',
        description: 'Delivery charge inside Dhaka (BDT)',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'delivery_outside_dhaka_charge',
        value: '120',
        type: 'NUMBER',
        category: 'DELIVERY',
        description: 'Delivery charge outside Dhaka (BDT)',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'free_delivery_threshold',
        value: '2000',
        type: 'NUMBER',
        category: 'DELIVERY',
        description: 'Order amount for free delivery (BDT)',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'delivery_days_inside_dhaka',
        value: '2-3',
        type: 'STRING',
        category: 'DELIVERY',
        description: 'Estimated delivery days inside Dhaka',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'delivery_days_outside_dhaka',
        value: '3-5',
        type: 'STRING',
        category: 'DELIVERY',
        description: 'Estimated delivery days outside Dhaka',
        isPublic: true,
      },
    }),
    // General settings
    prisma.setting.create({
      data: {
        key: 'site_name',
        value: 'Sticker Shop',
        type: 'STRING',
        category: 'GENERAL',
        description: 'Site name displayed in header and emails',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'site_currency',
        value: 'BDT',
        type: 'STRING',
        category: 'GENERAL',
        description: 'Default currency code',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'contact_email',
        value: 'support@stickershop.com',
        type: 'STRING',
        category: 'GENERAL',
        description: 'Contact email for customer inquiries',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'contact_phone',
        value: '+8801700000000',
        type: 'STRING',
        category: 'GENERAL',
        description: 'Contact phone number',
        isPublic: true,
      },
    }),
    // Custom request settings
    prisma.setting.create({
      data: {
        key: 'custom_request_enabled',
        value: 'true',
        type: 'BOOLEAN',
        category: 'GENERAL',
        description: 'Allow customers to submit custom sticker requests',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'custom_request_min_quantity',
        value: '10',
        type: 'NUMBER',
        category: 'GENERAL',
        description: 'Minimum quantity for custom requests',
        isPublic: true,
      },
    }),
    prisma.setting.create({
      data: {
        key: 'custom_request_max_dimension_cm',
        value: '30',
        type: 'NUMBER',
        category: 'GENERAL',
        description: 'Maximum dimension (width or height) in cm for custom requests',
        isPublic: true,
      },
    }),
  ])
  console.log('⚙️ Created settings:', settings.length)

  // Create sample notification for admin
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: 'WELCOME',
      title: 'Welcome to Sticker Shop Admin!',
      message: 'Your admin panel is ready. Start by adding products and configuring settings.',
      data: { url: '/admin/dashboard' },
      isRead: false,
    },
  })
  console.log('🔔 Created welcome notification')

  console.log('✅ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })