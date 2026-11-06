'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Product } from '@/types'
import { Tag, DollarSign, Settings, Eye, Edit3, Trash2, CheckCircle, XCircle, Package, Layers, Image as ImageIcon, Globe, Hash, Palette } from 'lucide-react'
import { DoodleShape, DoodleScribble, StickerPeel, WashiTape } from '@/components/decorative/DoodleElements'

interface ProductPreviewProps {
  product: Partial<Product>
  className?: string
}

export function ProductPreview({ product, className }: ProductPreviewProps) {
  const defaultDimension = product.allowedDimensions?.find((d: any) => d.isDefault) || product.allowedDimensions?.[0]
  const basePrice = (product.basePrice ?? 0) || 0
  const dimensionMultiplier = defaultDimension?.priceMultiplier || 1
  const effectivePrice = basePrice * dimensionMultiplier

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > (product.basePrice ?? 0)
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - (product.basePrice ?? 0)) / product.compareAtPrice!) * 100)
    : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl text-primary">Live Preview</h3>
          <p className="text-[var(--ink)]/60">See how your product will appear to customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={product.isActive ? 'success' : 'error'} size="sm">
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {product.isFeatured && <Badge variant="accent" size="sm">Featured</Badge>}
        </div>
      </div>

      {/* Product Card Preview */}
      <Card className="p-6 space-y-6 border-3 border-[var(--ink)]">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <div className="aspect-square rounded-input overflow-hidden bg-white border-2 border-[var(--ink)]/20 relative">
              <DoodleShape size="sm" color="primary" animation="float" className="absolute top-4 left-4 opacity-20 pointer-events-none" />
              <DoodleShape size="sm" color="secondary" animation="wobble" className="absolute bottom-4 right-4 opacity-20 pointer-events-none" style={{ animationDelay: '1s' }} />
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name as string}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/30">
                  <ImageIcon className="w-20 h-20" />
                </div>
              )}
            </div>
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.compareAtPrice && product.compareAtPrice > (product.basePrice ?? 0) && (
                <Badge variant="error" size="sm">-{Math.round(((product.compareAtPrice! - ((product.basePrice ?? 0) || 0)) / product.compareAtPrice!) * 100)}%</Badge>
              )}
              {(product as any).isFeatured && <Badge variant="accent" size="sm">Featured</Badge>}
            </div>
            <StickerPeel className="absolute top-0 right-0" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-sm font-medium text-secondary uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {(product as any).category?.name || 'Category'}
              </span>
              <h3 className="font-display text-2xl text-[var(--ink)] mt-1">{product.name || 'Product Name'}</h3>
            </div>

            {product.description && (
              <p className="text-body text-[var(--ink)]/70 line-clamp-3">{product.description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 flex-wrap">
              <span className="text-3xl font-display text-primary flex items-center gap-1">
                <DollarSign className="w-6 h-6" />
                {((product.basePrice ?? 0) || 0).toLocaleString()} BDT
              </span>
              {product.compareAtPrice && product.compareAtPrice > ((product.basePrice ?? 0) || 0) && (
                <>
                  <span className="text-xl text-[var(--ink)]/40 line-through">{(product.compareAtPrice as number).toLocaleString()} BDT</span>
                  <Badge variant="error" size="sm">-{Math.round(((product.compareAtPrice! - ((product.basePrice ?? 0) || 0)) / product.compareAtPrice!) * 100)}%</Badge>
                </>
              )}
            </div>

            {/* Tax Info */}
            {(product.taxPercent || 0) > 0 && (
              <p className="text-sm text-[var(--ink)]/60 flex items-center gap-1">
                <Settings className="w-4 h-4" />
                {(product as any).isTaxInclusive ? 'Price includes' : 'Plus'} {(product as any).taxPercent}% tax
              </p>
            )}

            {/* Dimensions */}
            {product.allowedDimensions && product.allowedDimensions.length > 0 && (
              <div className="pt-4 border-t border-[var(--ink)]/20">
                <h4 className="font-medium text-body text-[var(--ink)] mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Available Sizes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.allowedDimensions.map((dim: any) => (
                    <Badge
                      key={`${dim.width}x${dim.height}`}
                      variant={dim.isDefault ? 'primary' : 'outline'}
                      size="sm"
                    >
                      {dim.label} {dim.priceMultiplier !== 1 && `(${dim.priceMultiplier}x)`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Tiers */}
            {product.allowedQuantities && product.allowedQuantities.length > 0 && (
              <div className="pt-4 border-t border-[var(--ink)]/20">
                <h4 className="font-medium text-body text-[var(--ink)] mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Quantity Tiers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {product.allowedQuantities.map((qty: any) => (
                    <Badge key={`${qty.minQty}-${qty.maxQty}`} variant="outline" size="sm">
                      {qty.label}: {qty.pricePerUnit.toLocaleString()} BDT/unit
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Customization Options */}
            {product.customizationOptions && (
              <div className="pt-4 border-t border-[var(--ink)]/20">
                <h4 className="font-medium text-body text-[var(--ink)] mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Customization Options
                </h4>
                <div className="space-y-2">
                  {product.customizationOptions.materials?.length && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[var(--ink)]/60">Materials:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.customizationOptions.materials.map((m: string) => (
                          <Badge key={m} variant="outline" size="sm">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.customizationOptions.finishes?.length && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[var(--ink)]/60">Finishes:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.customizationOptions.finishes.map((f: string) => (
                          <Badge key={f} variant="outline" size="sm">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.customizationOptions.cutTypes?.length && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[var(--ink)]/60">Cut Types:</span>
                      <div className="flex flex-wrap gap-1">
                        {product.customizationOptions.cutTypes.map((c: string) => (
                          <Badge key={c} variant="outline" size="sm">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inventory */}
            {product.trackInventory && (
              <div className="pt-4 border-t border-[var(--ink)]/20 flex items-center justify-between">
                <div>
                  <p className="font-medium text-body text-[var(--ink)]">Inventory</p>
                  <p className="text-sm text-[var(--ink)]/60">
                    {product.stock || 0} in stock {product.lowStockThreshold && `(low at ${product.lowStockThreshold})`}
                  </p>
                </div>
                <Badge variant={(product.stock || 0) <= (product.lowStockThreshold || 10) ? 'warning' : 'success'} size="sm">
                  {(product.stock || 0) <= (product.lowStockThreshold || 10) ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--light)]">
        <Button variant="primary"><Eye className="w-4 h-4 mr-2" /> View on Store</Button>
        <Button variant="secondary"><Edit3 className="w-4 h-4 mr-2" /> Edit Product</Button>
        <Button variant="outline">Duplicate</Button>
        <Button variant="ghost" className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
      </div>
    </div>
  )
}

// Compact preview for lists
export function CompactProductPreview({ product }: { product: Partial<Product> }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-input border-2 border-[var(--ink)]/20 hover:border-primary/50 transition-colors">
      <div className="relative w-16 h-16 flex-shrink-0 rounded-input overflow-hidden border-2 border-[var(--ink)]/20 bg-[var(--light)]">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name as string} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/30">🏷️</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-body text-[var(--ink)] truncate">{product.name || 'Unnamed Product'}</h4>
        <p className="text-sm text-[var(--ink)]/50">{(product as any).category?.name || 'No category'}</p>
      </div>
      <div className="text-right">
        <p className="font-display text-primary">{((product.basePrice ?? 0) || 0).toLocaleString()} BDT</p>
        <Badge variant={product.isActive ? 'success' : 'error'} size="sm">
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )
}