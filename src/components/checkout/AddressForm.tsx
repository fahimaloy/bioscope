'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Address } from '@/types'
import { MapPin, Plus, Edit3, Trash2, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionVariants } from '@/lib/motion'

const divisions = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'
]

const districts = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Munshiganj', 'Manikganj', 'Narsingdi'],
  Chittagong: ['Chittagong', 'Cox\'s Bazar', 'Comilla', 'Brahmanbaria', 'Noakhali', 'Feni'],
  Rajshahi: ['Rajshahi', 'Bogra', 'Pabna', 'Natore', 'Sirajganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Jessore', 'Satkhira', 'Bagerhat', 'Meherpur', 'Chuadanga'],
  Barisal: ['Barisal', 'Patuakhali', 'Bhola', 'Jhalokati', 'Pirojpur'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Gaibandha'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'],
}

interface AddressFormProps {
  addresses: Address[]
  selectedAddressId?: string
  onSelectAddress: (addressId: string) => void
  onAddAddress?: (address: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void | Promise<void>
  onUpdateAddress?: (addressId: string, address: Partial<Address>) => void
  onDeleteAddress?: (addressId: string) => void
  onSetDefault?: (addressId: string) => void
  className?: string
  readOnly?: boolean
}

export function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefault,
  className,
  readOnly = false,
}: AddressFormProps) {
  const variants = useMotionVariants()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    division: 'Dhaka',
    postalCode: '',
    country: 'Bangladesh',
    isDefault: false,
    deliveryZone: 'INSIDE_DHAKA' as 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingAddress) {
        await onUpdateAddress?.(editingAddress.id, formData)
      } else {
        await onAddAddress?.(formData)
      }

      setShowForm(false)
      setEditingAddress(null)
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      district: address.district,
      division: address.division,
      postalCode: address.postalCode || '',
      country: address.country || 'Bangladesh',
      isDefault: address.isDefault,
      deliveryZone: address.deliveryZone,
    })
    setShowForm(true)
  }

  const handleDelete = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      onDeleteAddress?.(addressId)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      division: 'Dhaka',
      postalCode: '',
      country: 'Bangladesh',
      isDefault: false,
      deliveryZone: 'INSIDE_DHAKA' as 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA',
    })
  }

  const handleDivisionChange = (division: string) => {
    setFormData((prev) => ({ ...prev, division, district: '', city: '' }))
  }

  return (
    <div className={cn('space-y-6', className)}>
      {!readOnly && (
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-[var(--brand)]">Shipping Address</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        </div>
      )}

      {/* Address Form */}
      {showForm && !readOnly && (
        <motion.div
          variants={variants.fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] }}
        >
          <Card variant="doodle" padding="lg" className="relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display text-lg text-[var(--brand)]">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h4>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingAddress(null); resetForm() }}
                  className="text-[var(--text-subtle)] hover:text-[var(--brand)] transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+8801XXXXXXXXX"
                  required
                  type="tel"
                />
              </div>

              <Input
                label="Address Line 1"
                value={formData.addressLine1}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="House 123, Road 45"
                required
              />
              <Input
                label="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Block A, Apartment 4B"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Division"
                  value={formData.division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  options={divisions.map((d) => ({ value: d, label: d }))}
                  required
                />
                <Select
                  label="District"
                  value={formData.district}
                  onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                  options={districts[formData.division as keyof typeof districts]?.map((d) => ({ value: d, label: d })) || []}
                  required
                />
                <Input
                  label="City / Thana"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Gulshan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postalCode: e.target.value }))}
                  placeholder="1212"
                  maxLength={4}
                />
                <Select
                  label="Delivery Zone"
                  value={formData.deliveryZone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deliveryZone: e.target.value as 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA' }))}
                  options={[
                    { value: 'INSIDE_DHAKA', label: 'Inside Dhaka (60 BDT)' },
                    { value: 'OUTSIDE_DHAKA', label: 'Outside Dhaka (120 BDT)' },
                  ]}
                  required
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--surface-sunken)_50%,transparent)] border-2 border-[color-mix(in_srgb,var(--ink)_20%,transparent)] hover:border-[color-mix(in_srgb,var(--ink)_40%,transparent)] transition-colors">
                <Checkbox
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isDefault: checked === true }))}
                  className="h-5 w-5"
                />
                <span className="text-sm font-medium text-[var(--text)]">Set as default address</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-[color-mix(in_srgb,var(--ink)_15%,transparent)]">
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingAddress(null); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--paper-deep)] flex items-center justify-center">
              <MapPin className="w-8 h-8 text-[var(--text-subtle)]" />
            </div>
            <p className="text-[var(--text-subtle)] mb-4 font-medium">No saved addresses</p>
            {!readOnly && (
              <Button type="button" variant="secondary" size="sm" onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            )}
          </motion.div>
        ) : (
          addresses.map((address, index) => (
            <motion.div
              key={address.id}
              variants={variants.fadeInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: index * 0.05 }}
            >
              <AddressCard
                address={address}
                isSelected={selectedAddressId === address.id}
                onSelect={() => !readOnly && onSelectAddress(address.id)}
                onEdit={!readOnly ? () => handleEdit(address) : undefined}
                onDelete={!readOnly ? () => handleDelete(address.id) : undefined}
                onSetDefault={!readOnly ? () => onSetDefault?.(address.id) : undefined}
                readOnly={readOnly}
              />
            </motion.div>
          ))
        )}

        {!readOnly && addresses.length > 0 && (
          <motion.div
            variants={variants.fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Address
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  readOnly = false,
}: {
  address: Address
  isSelected: boolean
  onSelect: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  readOnly: boolean
}) {
  const deliveryZoneLabels = {
    INSIDE_DHAKA: 'Inside Dhaka',
    OUTSIDE_DHAKA: 'Outside Dhaka',
  }

  return (
    <Card
      variant="doodle"
      padding="md"
      hover={!readOnly}
      className={cn(
        'relative cursor-pointer transition-colors duration-300',
        isSelected
          ? 'border-[var(--brand)] shadow-ink-3 ring-2 ring-[var(--brand)]'
          : 'border-[color-mix(in_srgb,var(--ink)_30%,transparent)] hover:border-[var(--brand)]'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="font-display text-lg text-[var(--text)]">{address.name}</span>
            {address.isDefault && (
              <span className="px-2 py-1 text-xs font-medium bg-[var(--brand)] text-[var(--text)] rounded-pill">
                Default
              </span>
            )}
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-pill border',
              address.deliveryZone === 'INSIDE_DHAKA'
                ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--text)] border-[color-mix(in_srgb,var(--success)_40%,transparent)]'
                : 'bg-[color-mix(in_srgb,var(--blue)_12%,transparent)] text-[var(--text)] border-[color-mix(in_srgb,var(--blue)_40%,transparent)]'
            )}>
              {deliveryZoneLabels[address.deliveryZone]}
            </span>
          </div>
          <p className="text-[var(--text-muted)] mb-1">{address.phone}</p>
          <p className="text-sm text-[var(--text-subtle)]">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
            {`, ${address.city}, ${address.district}, ${address.division}`}
            {address.postalCode && ` - ${address.postalCode}`}
          </p>
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect() }}
              className={cn(
                'px-3 py-1.5 rounded-pill text-sm font-medium transition-colors duration-200',
                isSelected
                  ? 'bg-[var(--brand)] text-[var(--text)] shadow-ink-2'
                  : 'bg-[var(--paper-deep)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] hover:text-[var(--brand)]'
              )}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit() }}
                className="p-2 text-[var(--text-subtle)] hover:text-[var(--brand)] hover:bg-[var(--paper-deep)] rounded-[var(--radius-md)] transition-colors"
                aria-label="Edit address"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-2 text-[var(--text-subtle)] hover:text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)] rounded-[var(--radius-md)] transition-colors"
                aria-label="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onSetDefault && !address.isDefault && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSetDefault() }}
                className="p-2 text-[var(--text-subtle)] hover:text-[var(--brand)] hover:bg-[var(--paper-deep)] rounded-[var(--radius-md)] transition-colors"
                aria-label="Set as default"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {isSelected && readOnly && (
          <div className="w-6 h-6 rounded-full bg-[var(--brand)] flex items-center justify-center flex-shrink-0 ml-4">
            <CheckCircle className="w-4 h-4 text-[var(--text)]" />
          </div>
        )}
      </div>
    </Card>
  )
}
