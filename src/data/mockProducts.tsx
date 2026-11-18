export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Custom Logo Vinyl Sticker',
    slug: 'custom-logo-vinyl-sticker',
    description: 'High-quality vinyl stickers with your custom logo. Weatherproof and durable.',
    basePrice: 150,
    compareAtPrice: 200,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/stickers/vinyl-logo-1.jpg'],
    categoryId: 'vinyl-stickers',
    category: { name: 'Vinyl Stickers' },
    allowedDimensions: [
      { id: '1', width: 5, height: 5, label: 'Small (5x5 cm)', priceMultiplier: 1, isDefault: true, sortOrder: 1 },
      { id: '2', width: 7, height: 7, label: 'Medium (7x7 cm)', priceMultiplier: 1.5, sortOrder: 2 },
      { id: '3', width: 10, height: 10, label: 'Large (10x10 cm)', priceMultiplier: 2, sortOrder: 3 },
    ],
    allowedQuantities: [
      { id: '1', minQty: 1, maxQty: 10, pricePerUnit: 150, label: '1-10 pcs', sortOrder: 1 },
      { id: '2', minQty: 11, maxQty: 50, pricePerUnit: 120, label: '11-50 pcs', sortOrder: 2 },
    ],
    isFeatured: true,
    isActive: true,
    stock: 500,
  },
  {
    id: '2',
    name: 'Waterproof Bottle Stickers',
    slug: 'waterproof-bottle-stickers',
    description: 'Dishwasher-safe vinyl stickers perfect for water bottles, laptops, and gear.',
    basePrice: 120,
    compareAtPrice: 160,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/stickers/bottle-1.jpg'],
    categoryId: 'vinyl-stickers',
    category: { name: 'Vinyl Stickers' },
    allowedDimensions: [
      { id: '1', width: 6, height: 6, label: 'Standard (6x6 cm)', priceMultiplier: 1, isDefault: true, sortOrder: 1 },
    ],
    allowedQuantities: [
      { id: '1', minQty: 1, maxQty: 20, pricePerUnit: 120, label: '1-20 pcs', sortOrder: 1 },
    ],
    isFeatured: true,
    isActive: true,
    stock: 300,
  },
  {
    id: '3',
    name: 'Kraft Paper Label Stickers',
    slug: 'kraft-paper-label-stickers',
    description: 'Eco-friendly kraft paper stickers perfect for product packaging.',
    basePrice: 80,
    compareAtPrice: 110,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/stickers/kraft-1.jpg'],
    categoryId: 'paper-stickers',
    category: { name: 'Paper Stickers' },
    allowedDimensions: [
      { id: '1', width: 4, height: 4, label: 'Small (4x4 cm)', priceMultiplier: 1, isDefault: true, sortOrder: 1 },
    ],
    allowedQuantities: [
      { id: '1', minQty: 50, maxQty: 100, pricePerUnit: 80, label: '50-100 pcs', sortOrder: 1 },
    ],
    isFeatured: false,
    isActive: true,
    stock: 1000,
  },
  {
    id: '4',
    name: 'Holographic Sparkle Stickers',
    slug: 'holographic-sparkle-stickers',
    description: 'Mesmerizing holographic stickers that shift colors in the light.',
    basePrice: 200,
    compareAtPrice: 280,
    images: ['https://res.cloudinary.com/demo/image/upload/v1/stickers/holo-1.jpg'],
    categoryId: 'holographic-stickers',
    category: { name: 'Holographic Stickers' },
    allowedDimensions: [
      { id: '1', width: 5, height: 5, label: 'Small (5x5 cm)', priceMultiplier: 1, isDefault: true, sortOrder: 1 },
    ],
    allowedQuantities: [
      { id: '1', minQty: 1, maxQty: 10, pricePerUnit: 200, label: '1-10 pcs', sortOrder: 1 },
    ],
    isFeatured: true,
    isActive: true,
    stock: 50,
  },
]

export const CATEGORIES = [
  { id: 'vinyl-stickers', name: 'Vinyl Stickers' },
  { id: 'paper-stickers', name: 'Paper Stickers' },
  { id: 'holographic-stickers', name: 'Holographic Stickers' },
  { id: 'clear-stickers', name: 'Clear Stickers' },
  { id: 'custom-shapes', name: 'Custom Shapes' },
]

/** Shape of a mock product row for DataTable. */
interface MockProductRow {
  id: string
  name: string
  slug: string
  images: string[]
  basePrice: number
  category: { name: string } | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
}

export const COLUMNS = [
  // eslint-disable-next-line @next/next/no-img-element
  { key: 'image', header: 'Image', cell: (row: MockProductRow) => <img src={row.images?.[0]} alt={row.name} className="w-12 h-12 rounded-input object-cover" /> },
  { key: 'name', header: 'Product', accessor: (row: MockProductRow) => row.name, sortable: true },
  { key: 'category', header: 'Category', accessor: (row: MockProductRow) => row.category?.name },
  { key: 'price', header: 'Price', accessor: (row: MockProductRow) => `${row.basePrice.toLocaleString()} BDT`, sortable: true },
  { key: 'stock', header: 'Stock', accessor: (row: MockProductRow) => row.stock, sortable: true },
  { key: 'status', header: 'Status', cell: (row: MockProductRow) => row.isActive ? 'Active' : 'Inactive' },
  { key: 'featured', header: 'Featured', cell: (row: MockProductRow) => row.isFeatured ? 'Yes' : 'No' },
  { key: 'createdAt', header: 'Created', accessor: (row: MockProductRow) => new Date(row.createdAt).toLocaleDateString(), sortable: true },
]