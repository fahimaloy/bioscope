'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Plus, Minus, Trash2, Settings, Percent, Calculator } from 'lucide-react'

interface TaxConfigProps {
  onChange: (settings: any) => void
  initialSettings?: any
}

export function TaxConfig({ onChange, initialSettings = {} }: TaxConfigProps) {
  const [globalTax, setGlobalTax] = useState(initialSettings.global_tax_percent || 5)
  const [taxInclusive, setTaxInclusive] = useState(initialSettings.tax_inclusive_pricing || false)
  const [taxCategories, setTaxCategories] = useState<Array<{ id: string; name: string; rate: number; description: string }>>(
    initialSettings.tax_categories || [
      { id: 'standard', name: 'Standard Rate', rate: globalTax, description: 'Applies to most products' },
      { id: 'reduced', name: 'Reduced Rate', rate: 0, description: 'Essential items' },
      { id: 'zero', name: 'Zero Rate', rate: 0, description: 'Exempt items' },
    ]
  )
  const [showCategories, setShowCategories] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', rate: 0, description: '' })

  const handleGlobalChange = () => {
    onChange({
      global_tax_percent: globalTax,
      tax_inclusive_pricing: taxInclusive,
    })
  }

  const addCategory = () => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      rate: 0,
      description: '',
    }
    setTaxCategories((prev) => [...prev, newCategory])
    setEditingCategory(newCategory.id)
    setCategoryForm({ name: '', rate: 0, description: '' })
  }

  const saveCategory = (id: string) => {
    setTaxCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...categoryForm } : cat))
    )
    setEditingCategory(null)
    onChange({ tax_categories: taxCategories.map((c) => (c.id === id ? { ...c, ...categoryForm } : c)) })
  }

  const deleteCategory = (id: string) => {
    if (taxCategories.length <= 1) return
    setTaxCategories((prev) => prev.filter((c) => c.id !== id))
    onChange({ tax_categories: taxCategories.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-6">
      {/* Global Tax Settings */}
      <div className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-input bg-primary/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-xl text-primary">Global Tax Settings</h3>
              <p className="text-[var(--text-subtle)]">Configure default tax behavior for all products</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Global Tax Rate (%)</label>
            <div className="relative">
              <Input
                type="number"
                value={globalTax}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                  setGlobalTax(val)
                  handleGlobalChange()
                }}
                min={0}
                max={100}
                step={0.01}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] font-medium">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Tax Calculation Method</label>
            <Select
              value={taxInclusive ? 'inclusive' : 'exclusive'}
              onChange={(e) => {
                setTaxInclusive(e.target.value === 'inclusive')
                handleGlobalChange()
              }}
              options={[
                { value: 'exclusive', label: 'Tax Exclusive (Added on top)' },
                { value: 'inclusive', label: 'Tax Inclusive (Included in price)' },
              ]}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInclusive}
                onChange={(e) => {
                  setTaxInclusive(e.target.checked)
                  handleGlobalChange()
                }}
                className="w-4 h-4 text-primary border-2 border-[var(--ink)] rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-[var(--ink)]">Display prices with tax included</span>
            </label>
          </div>
        </div>

        {/* Tax Preview */}
        <div className="mt-6 p-4 bg-[var(--light)] rounded-input border-2 border-[var(--ink)]">
          <h4 className="font-medium text-body text-[var(--ink)] mb-3">Tax Calculation Preview</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-display text-primary">100.00</div>
              <div className="text-xs text-[var(--text-subtle)]">Base Price</div>
            </div>
            <div>
              <div className="text-2xl font-display text-primary">+{globalTax.toFixed(2)}%</div>
              <div className="text-xs text-[var(--text-subtle)]">Tax Amount</div>
            </div>
            <div>
              <div className="text-2xl font-display text-primary">
                {taxInclusive ? '100.00' : (100 + globalTax).toFixed(2)}
              </div>
              <div className="text-xs text-[var(--text-subtle)]">Final Price</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Categories */}
      <div className="border-t border-[var(--light)] pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-primary flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tax Categories
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowCategories(!showCategories)}>
            {showCategories ? <Minus className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showCategories ? 'Hide' : 'Manage'} Categories
          </Button>
        </div>

        {showCategories && (
          <div className="space-y-4">
            {taxCategories.map((category) => {
              const isEditing = editingCategory === category.id

              if (isEditing) {
                return (
                  <div key={category.id} className="bg-[var(--light)] rounded-input p-4 border-2 border-[var(--ink)] animate-scale-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <Input
                        label="Category Name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Luxury Items"
                      />
                      <Input
                        type="number"
                        label="Tax Rate (%)"
                        value={categoryForm.rate}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                        min={0}
                        max={100}
                        step={0.01}
                      />
                      <Input
                        label="Description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="When to apply this rate"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => saveCategory(category.id)}>
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={category.id} className="flex items-center justify-between p-4 bg-[var(--light)] rounded-input border-2 border-[var(--ink)]">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-body text-[var(--ink)]">{category.name}</span>
                      <Badge variant="primary" size="sm">{category.rate.toFixed(2)}%</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-subtle)] mt-1">{category.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingCategory(category.id)
                      setCategoryForm({ name: category.name, rate: category.rate, description: category.description })
                    }}>
                      Edit
                    </Button>
                    {taxCategories.length > 1 && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => deleteCategory(category.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            <Button variant="outline" onClick={addCategory} className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Tax Category
            </Button>
          </div>
        )}
      </div>

      {/* Product-specific Tax Note */}
      <div className="bg-accent/20 border-2 border-accent rounded-input p-4">
        <div className="flex items-center gap-3">
          <Calculator className="w-6 h-6 text-accent" />
          <div>
            <h4 className="font-medium text-body text-[var(--ink)]">Product-Specific Tax</h4>
            <p className="text-sm text-[var(--text-subtle)]">
              Individual products can override global tax settings. When editing a product,
              you can set a specific tax percentage and additional charge that applies only to that product.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
