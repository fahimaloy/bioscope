'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { DimensionSelector } from '@/components/product/DimensionSelector'
import { QuantitySelector } from '@/components/product/QuantitySelector'
import type { Product, DimensionConfig, QuantityConfig } from '@/types'
import { Plus, Trash2, Settings, Tag, Package, Layers, Image as ImageIcon } from 'lucide-react'
import { StickerPeel, WashiTape } from '@/components/decorative/DoodleElements'
import { Card } from '@/components/ui/Card'

interface ProductFormProps {
  initialData?: Partial<Product>
  categories: Array<{ id: string; name: string }>
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
  className?: string
}

export interface ProductFormData {
  name: string
  slug: string
  description: string
  basePrice: number
  compareAtPrice?: number
  categoryId: string
  images: string[]
  allowedDimensions: DimensionConfig[]
  allowedQuantities: QuantityConfig[]
  customizationOptions: {
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
  taxPercent: number
  additionalCharge: number
  isTaxInclusive: boolean
  trackInventory: boolean
  stock: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  metaTitle: string
  metaDescription: string
}

const uid = () => crypto.randomUUID()

const DEFAULT_DIMENSIONS: DimensionConfig[] = [
  { id: uid(), width: 5, height: 5, label: 'Small (5×5 cm)', priceMultiplier: 1, isDefault: true, sortOrder: 1 },
  { id: uid(), width: 7, height: 7, label: 'Medium (7×7 cm)', priceMultiplier: 1.5, sortOrder: 2 },
  { id: uid(), width: 10, height: 10, label: 'Large (10×10 cm)', priceMultiplier: 2, sortOrder: 3 },
]

const DEFAULT_QUANTITIES: QuantityConfig[] = [
  { id: uid(), minQty: 1, maxQty: 10, pricePerUnit: 100, label: '1-10 pcs', sortOrder: 1 },
  { id: uid(), minQty: 11, maxQty: 50, pricePerUnit: 80, label: '11-50 pcs', sortOrder: 2 },
  { id: uid(), minQty: 51, maxQty: 100, pricePerUnit: 70, label: '51-100 pcs', sortOrder: 3 },
  { id: uid(), minQty: 101, maxQty: null, pricePerUnit: 60, label: '100+ pcs', sortOrder: 4 },
]

export function ProductForm({
  categories,
  onSubmit,
  onCancel,
  isEditing = false,
  className,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    basePrice: 0,
    compareAtPrice: undefined,
    categoryId: '',
    images: [],
    allowedDimensions: DEFAULT_DIMENSIONS.map((d, i) => ({ ...d, id: `dim-${i}` })),
    allowedQuantities: DEFAULT_QUANTITIES.map((q, i) => ({ ...q, id: `qty-${i}` })),
    customizationOptions: {
      materials: ['vinyl', 'paper', 'holographic', 'clear'],
      finishes: ['matte', 'glossy'],
      cutTypes: ['kiss_cut', 'die_cut'],
    },
    taxPercent: 5,
    additionalCharge: 0,
    isTaxInclusive: false,
    trackInventory: true,
    stock: 100,
    lowStockThreshold: 10,
    isActive: true,
    isFeatured: false,
    sortOrder: 0,
    metaTitle: '',
    metaDescription: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'config' | 'seo' | 'preview'>('basic')

  const validate = () => {
    const newErrors: Record<string, boolean> = {}

    if (!formData.name.trim()) newErrors.name = true
    if (!formData.slug.trim()) newErrors.slug = true
    if (!formData.categoryId) newErrors.categoryId = true
    if (formData.basePrice <= 0) newErrors.basePrice = true
    if (formData.images.length === 0) newErrors.images = true
    if (formData.allowedDimensions.length === 0) newErrors.allowedDimensions = true
    if (formData.allowedQuantities.length === 0) newErrors.allowedQuantities = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to submit product:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const addDimension = () => {
    const newDim: DimensionConfig = {
      id: `dim-${Date.now()}`,
      width: 5,
      height: 5,
      label: `Custom ${formData.allowedDimensions.length + 1}`,
      priceMultiplier: 1,
      isDefault: false,
      sortOrder: formData.allowedDimensions.length,
    }
    setFormData((prev) => ({ ...prev, allowedDimensions: [...prev.allowedDimensions, newDim] }))
  }


  const addQuantity = () => {
    const lastQty = formData.allowedQuantities[formData.allowedQuantities.length - 1]
    const newQty: QuantityConfig = {
      id: `qty-${Date.now()}`,
      minQty: (lastQty?.maxQty || 0) + 1,
      maxQty: null,
      pricePerUnit: formData.basePrice * 0.9,
      label: `${(lastQty?.maxQty || 0) + 1}+ pcs`,
      sortOrder: formData.allowedQuantities.length,
    }
    setFormData((prev) => ({ ...prev, allowedQuantities: [...prev.allowedQuantities, newQty] }))
  }

  const removeQuantity = (id: string) => {
    if (formData.allowedQuantities.length <= 1) return
    setFormData((prev) => ({
      ...prev,
      allowedQuantities: prev.allowedQuantities.filter((q) => q.id !== id),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Tabs */}
      <Tabs defaultValue={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)} variant="pills">
        <TabsList className="grid w-full grid-cols-5 gap-1 p-1 bg-[var(--light)] rounded-card">
          <TabsTrigger value="basic"><Package className="w-4 h-4 mr-1" /> Basic Info</TabsTrigger>
          <TabsTrigger value="images"><ImageIcon className="w-4 h-4 mr-1" /> Images</TabsTrigger>
          <TabsTrigger value="variants"><Layers className="w-4 h-4 mr-1" /> Variants</TabsTrigger>
          <TabsTrigger value="seo"><Tag className="w-4 h-4 mr-1" /> SEO</TabsTrigger>
          <TabsTrigger value="advanced"><Settings className="w-4 h-4 mr-1" /> Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                    if (!formData.slug || !isEditing) {
                      setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                  }}
                  error={errors.name ? 'Product name is required' : undefined}
                  placeholder="Enter product name"
                />
                <Input
                  label="Slug (URL)"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  error={errors.slug ? 'Slug is required' : undefined}
                  placeholder="auto-generated-from-name"
                />
                <Select
                  label="Category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  error={errors.categoryId ? 'Category is required' : undefined}
                  placeholder="Select category"
                />
                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product..."
                  rows={5}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-body text-[var(--ink)]">Status</label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                    <Checkbox
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-[var(--ink)]">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                    <Checkbox
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked === true }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-[var(--ink)]">Featured</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <label className="block font-medium text-body text-[var(--ink)]">Product Images</label>
            <div className="relative border-3 border-dashed border-[var(--secondary)] rounded-card p-8 transition-all duration-200 hover:border-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_5%,transparent)]">
              <ImageUpload
                value={formData.images}
                onChange={(files) => setFormData((prev) => ({ ...prev, images: files.map((f) => (typeof f === 'string' ? f : URL.createObjectURL(f))) }))}
                accept="image/*"
                maxSize={8}
                maxFiles={10}
                multiple
                showPreview
                removable
                hint="Upload up to 10 images (max 8MB each). First image is the main thumbnail."
              />
              <WashiTape rotation={-3} width={180} height={28} className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-80" />
            </div>
            {errors.images && (
              <p className="text-sm text-red-500">At least one image is required</p>
            )}
          </Card>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <h4 className="font-medium text-body text-[var(--ink)] mb-4">Dimension Configurations</h4>
            <DimensionSelector
              dimensions={formData.allowedDimensions}
              selectedDimension={formData.allowedDimensions.find((d) => d.isDefault)}
              onChange={(dim) => setFormData((prev) => ({
                ...prev,
                allowedDimensions: prev.allowedDimensions.map((d) => d.id === dim.id ? dim : d),
              }))}
              variant="cards"
            />
            <div className="mt-4 flex gap-2">
              <Button variant="doodle-outline" onClick={addDimension}>
                <Plus className="w-4 h-4 mr-1" />
                Add Dimension
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h4 className="font-medium text-body text-[var(--ink)] mb-4">Quantity Tiers</h4>
            <QuantitySelector
              quantity={1}
              onChange={() => {}}
              quantityConfigs={formData.allowedQuantities}
              showTierBadges
              disabled
            />
            <div className="mt-4 space-y-3">
              {formData.allowedQuantities.map((qty) => (
                <div key={qty.id} className="flex items-center gap-3 p-3 bg-[var(--light)] rounded-input border border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                  <Input
                    type="number"
                    label="Min Qty"
                    value={qty.minQty}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      allowedQuantities: prev.allowedQuantities.map((q) => q.id === qty.id ? { ...q, minQty: parseInt(e.target.value) || 1 } : q),
                    }))}
                    className="w-24"
                  />
                  <Input
                    type="number"
                    label="Max Qty"
                    value={qty.maxQty || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      allowedQuantities: prev.allowedQuantities.map((q) => q.id === qty.id ? { ...q, maxQty: parseInt(e.target.value) || null } : q),
                    }))}
                    className="w-24"
                    placeholder="Unlimited"
                  />
                  <Input
                    type="number"
                    label="Price/Unit (BDT)"
                    value={qty.pricePerUnit}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      allowedQuantities: prev.allowedQuantities.map((q) => q.id === qty.id ? { ...q, pricePerUnit: parseFloat(e.target.value) || 0 } : q),
                    }))}
                    step={0.01}
                    className="w-32"
                  />
                  <Input
                    label="Label"
                    value={qty.label}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      allowedQuantities: prev.allowedQuantities.map((q) => q.id === qty.id ? { ...q, label: e.target.value } : q),
                    }))}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeQuantity(qty.id)} className="text-red-500 hover:-translate-y-1 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="doodle-outline" onClick={addQuantity}>
                <Plus className="w-4 h-4 mr-1" />
                Add Quantity Tier
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h4 className="font-medium text-body text-[var(--ink)] mb-4">Customization Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomizationField
                label="Materials"
                value={formData.customizationOptions.materials || []}
                onChange={(v) => setFormData((prev) => ({
                  ...prev,
                  customizationOptions: { ...prev.customizationOptions, materials: v },
                }))}
                options={['vinyl', 'paper', 'holographic', 'clear', 'kraft']}
              />
              <CustomizationField
                label="Finishes"
                value={formData.customizationOptions.finishes || []}
                onChange={(v) => setFormData((prev) => ({
                  ...prev,
                  customizationOptions: { ...prev.customizationOptions, finishes: v },
                }))}
                options={['matte', 'glossy', 'transparent']}
              />
              <CustomizationField
                label="Cut Types"
                value={formData.customizationOptions.cutTypes || []}
                onChange={(v) => setFormData((prev) => ({
                  ...prev,
                  customizationOptions: { ...prev.customizationOptions, cutTypes: v },
                }))}
                options={['kiss_cut', 'die_cut', 'custom']}
              />
              <CustomizationField
                label="Colors"
                value={formData.customizationOptions.colors || []}
                onChange={(v) => setFormData((prev) => ({
                  ...prev,
                  customizationOptions: { ...prev.customizationOptions, colors: v },
                }))}
                options={['red', 'blue', 'green', 'yellow', 'black', 'white', 'custom']}
              />
            </div>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                label="Meta Title"
                value={formData.metaTitle}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="Product name - Site Name"
                maxLength={60}
              />
              <Textarea
                label="Meta Description"
                value={formData.metaDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="Brief description for search results..."
                rows={3}
                maxLength={160}
              />
            </div>

            <div className="pt-4 border-t border-[var(--light)] space-y-4">
              <h4 className="font-medium text-body text-[var(--ink)]">Display Settings</h4>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Sort Order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                  <Checkbox
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked === true }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[var(--ink)]">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                  <Checkbox
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked === true }))}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-[var(--ink)]">Featured</span>
                </label>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6 pt-4">
          <Card className="p-6 space-y-6">
            <h4 className="font-medium text-body text-[var(--ink)]">Base Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Price (BDT)"
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={0.01}
                error={errors.basePrice ? 'Base price must be positive' : undefined}
              />
              <Input
                label="Compare At Price (BDT)"
                type="number"
                value={formData.compareAtPrice || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, compareAtPrice: parseFloat(e.target.value) || undefined }))}
                min={0}
                step={0.01}
                placeholder="Optional: Original price for discount display"
              />
            </div>

            <h4 className="font-medium text-body text-[var(--ink)] mt-6">Tax Settings</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Tax %"
                type="number"
                value={formData.taxPercent}
                onChange={(e) => setFormData((prev) => ({ ...prev, taxPercent: parseFloat(e.target.value) || 0 }))}
                min={0}
                max={100}
                step={0.01}
              />
              <Input
                label="Additional Charge (BDT)"
                type="number"
                value={formData.additionalCharge}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalCharge: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={0.01}
              />
              <label className="flex items-center gap-2 cursor-pointer mt-6 p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
                <Checkbox
                  checked={formData.isTaxInclusive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isTaxInclusive: checked === true }))}
                  className="h-4 w-4"
                />
                <span className="text-sm text-[var(--ink)]">Price includes tax</span>
              </label>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h4 className="font-medium text-body text-[var(--ink)]">Inventory</h4>
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-[var(--light)] rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--primary)_50%,transparent)] transition-colors">
              <Checkbox
                checked={formData.trackInventory}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, trackInventory: checked === true }))}
                className="h-4 w-4"
              />
              <span className="text-sm text-[var(--ink)]">Track inventory</span>
            </label>

            {formData.trackInventory && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock Quantity"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 10 }))}
                  min={0}
                />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--light)]">
        <div className="flex gap-2">
          <Button type="button" variant="doodle-secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="flex gap-3">
          <Button type="submit" variant="doodle" loading={submitting}>
            {isEditing ? 'Update Product' : 'Create Product'}
            <StickerPeel />
          </Button>
        </div>
      </div>
    </form>
  )
}

// Helper component for customization fields
function CustomizationField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  options: string[]
}) {
  return (
    <div>
      <label className="block font-medium text-body text-[var(--ink)] mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])}
            className={cn(
              'px-3 py-1.5 rounded-input text-sm font-medium transition-all',
              value.includes(option)
                ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-btn'
                : 'bg-[var(--light)] text-[var(--ink)] hover:bg-dark/10 border border-[color-mix(in_srgb,var(--ink)_20%,transparent)]'
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

