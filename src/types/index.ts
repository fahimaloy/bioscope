// Type exports for the entire application
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from 'react'

// User & Auth
export type UserRole = 'CUSTOMER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  phone: string | null
  avatar: string | null
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  image: string | null
  phone?: string | null
  avatar?: string | null
  createdAt?: Date | string
  emailVerified?: Date | string | null
  addresses?: Address[]
}

// Category
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    products: number
  }
}

// Product
export interface DimensionConfig {
  id: string
  productId?: string
  width: number
  height: number
  label: string
  priceMultiplier: number
  isDefault?: boolean
  sortOrder: number
}

export interface QuantityConfig {
  id: string
  productId?: string
  minQty: number
  maxQty: number | null
  pricePerUnit: number
  label: string
  sortOrder: number
}

export interface CustomizationOptions {
  materials?: string[]
  finishes?: string[]
  cutTypes?: string[]
  colors?: string[]
  customFields?: Array<{
    key: string
    label: string
    type: 'text' | 'select' | 'color' | 'boolean'
    required: boolean
    options?: string[]
  }>
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  compareAtPrice: number | null
  images: string[]
  categoryId: string
  category?: Category
  allowedDimensions: DimensionConfig[]
  allowedQuantities: QuantityConfig[]
  customizationOptions: CustomizationOptions | null
  taxPercent: number
  additionalCharge: number
  isTaxInclusive: boolean
  trackInventory: boolean
  stock: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  metaTitle: string | null
  metaDescription: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    reviews: number
    orderItems: number
  }
}

export interface ProductWithPrice extends Product {
  effectivePrice: number
  effectiveCompareAtPrice: number | null
}

// Cart
export interface CartItem {
  id: string
  cartId: string
  productId: string
  product: Product
  // Denormalized for quick rendering (populated by cartStore.addItem)
  productName: string
  productSlug: string
  productImage: string | null
  unitPrice: number
  width: number
  height: number
  quantity: number
  customization: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  createdAt: Date
  updatedAt: Date
}

// Order
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PRINTING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export type PaymentMethod = 'COD' | 'BANK_TRANSFER'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type DeliveryZone = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product: Product
  productName: string
  productSlug: string
  productImage: string
  width: number
  height: number
  quantity: number
  unitPrice: number
  totalPrice: number
  taxPercent: number
  taxAmount: number
  customization: Record<string, any> | null
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  user?: User
  status: OrderStatus
  subtotal: number
  taxAmount: number
  deliveryCharge: number
  discountAmount: number
  total: number
  currency: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingDivision: string
  shippingPostalCode: string | null
  deliveryZone: DeliveryZone
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  transactionId: string | null
  trackingNumber: string | null
  shippedAt: Date | null
  deliveredAt: Date | null
  notes: string | null
  adminNotes: string | null
  createdAt: Date
  updatedAt: Date
  items: OrderItem[]
  address?: Address
  customRequest?: CustomRequest
}

export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  district: string
  division: string
  postalCode: string | null
  country: string
  isDefault: boolean
  deliveryZone: DeliveryZone
  createdAt: Date
  updatedAt: Date
}

// Custom Request
export type CustomRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRICED' | 'ORDERED'

export interface CustomRequest {
  id: string
  userId: string
  user?: User
  imageUrl: string
  originalName: string
  width: number
  height: number
  quantity: number
  material: string
  finish: string
  cutType: string
  notes: string | null
  status: CustomRequestStatus
  adminNotes: string | null
  quotedPrice: number | null
  quotedAt: Date | null
  orderedAt: Date | null
  orderId: string | null
  order?: Order
  createdAt: Date
  updatedAt: Date
}

// Review
export interface Review {
  id: string
  userId: string
  user?: User
  productId: string
  product?: Product
  rating: number
  title: string | null
  comment: string | null
  images: string[]
  isVerifiedPurchase: boolean
  isApproved: boolean
  helpfulCount?: number
  createdAt: Date
  updatedAt?: Date
}

// Settings
export interface Setting {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON'
  category: 'TAX' | 'DELIVERY' | 'GENERAL' | 'EMAIL'
  description: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PublicSettings {
  globalTaxPercent: number
  taxInclusivePricing: boolean
  deliveryEnabled: boolean
  insideDhakaCharge: number
  outsideDhakaCharge: number
  freeDeliveryThreshold: number
  deliveryDaysInsideDhaka: string
  deliveryDaysOutsideDhaka: string
  siteName: string
  siteCurrency: string
  contactEmail: string
  contactPhone: string
  customRequestEnabled: boolean
  customRequestMinQuantity: number
  customRequestMaxDimensionCm: number
}

// Notification
export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data: Record<string, any> | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form types
export interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

// Component props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

// Sticker Builder types
export interface StickerDesign {
  background: FabricImage | null
  layers: DesignLayer[]
  canvas: {
    width: number
    height: number
    dpi: number
  }
  material: MaterialType
  finish: FinishType
  cutType: CutType
}

export interface DesignLayer {
  id: string
  type: 'image' | 'text' | 'shape'
  visible: boolean
  locked: boolean
  zIndex: number
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
  // Image specific
  imageUrl?: string
  imageFilter?: ImageFilter
  // Text specific
  text?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
  charSpacing?: number
  // Shape specific
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'polygon'
  fill?: string
  stroke?: string
  strokeWidth?: number
  sides?: number
}

export interface FabricImage {
  id: string
  url: string
  imageFilter?: ImageFilter
  width: number
  height: number
  scaleX: number
  scaleY: number
  angle: number
  left: number
  top: number
}

export interface ImageFilter {
  brightness?: number
  contrast?: number
  saturation?: number
  hue?: number
  blur?: number
  grayscale?: number
  sepia?: number
  shadows?: number
  midtones?: number
  highlights?: number
}

export type MaterialType = 'vinyl' | 'paper' | 'holographic' | 'clear' | 'kraft'
export type FinishType = 'matte' | 'glossy' | 'transparent'
export type CutType = 'kiss_cut' | 'die_cut' | 'custom'

export const MATERIAL_OPTIONS: { value: MaterialType; label: string; priceMultiplier: number }[] = [
  { value: 'vinyl', label: 'Vinyl (Durable, Weatherproof)', priceMultiplier: 1.0 },
  { value: 'paper', label: 'Paper (Eco-friendly, Indoor)', priceMultiplier: 0.7 },
  { value: 'holographic', label: 'Holographic (Color-shifting)', priceMultiplier: 1.5 },
  { value: 'clear', label: 'Clear (Transparent)', priceMultiplier: 1.2 },
  { value: 'kraft', label: 'Kraft Paper (Natural, Rustic)', priceMultiplier: 0.8 },
]

export const FINISH_OPTIONS: { value: FinishType; label: string; priceMultiplier: number }[] = [
  { value: 'matte', label: 'Matte (Non-reflective)', priceMultiplier: 1.0 },
  { value: 'glossy', label: 'Glossy (Shiny)', priceMultiplier: 1.0 },
  { value: 'transparent', label: 'Transparent (Clear)', priceMultiplier: 1.1 },
]

export const CUT_TYPE_OPTIONS: { value: CutType; label: string; priceMultiplier: number }[] = [
  { value: 'kiss_cut', label: 'Kiss Cut (Peel-off backing)', priceMultiplier: 1.0 },
  { value: 'die_cut', label: 'Die Cut (Cut to shape)', priceMultiplier: 1.2 },
  { value: 'custom', label: 'Custom Shape', priceMultiplier: 1.5 },
]

// Socket events
export interface SocketEvents {
  'order:created': (data: { orderId: string; orderNumber: string; customerName: string; total: number; itemCount: number; createdAt: string }) => void
  'order:status_changed': (data: { orderId: string; orderNumber: string; oldStatus: string; newStatus: string; statusLabel: string; customerName?: string; updatedAt: string }) => void
  'custom_request:submitted': (data: { requestId: string; customerName: string; imageUrl: string; dimensions: string; quantity: number; material: string; finish: string; cutType: string; createdAt: string }) => void
  'custom_request:priced': (data: { requestId: string; quotedPrice: number; adminNotes?: string; quotedAt: string }) => void
  'notification:new': (data: { id: string; type: string; title: string; message: string; data?: any; createdAt: string }) => void
  'product:low_stock': (data: { productId: string; productName: string; currentStock: number; threshold: number }) => void
}