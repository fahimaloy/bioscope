'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Address } from '@/types'
import { MapPin, Home, Building2, Plus, Edit3, Trash2, CheckCircle } from 'lucide-react'

interface AddressFormProps {
  addresses: Address[]
  selectedAddressId?: string
  onSelectAddress: (addressId: string) => void
  onAddAddress?: (address: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void | Promise<void>
  onUpdateAddress?: (addressId: string, address: Partial<Address>) => void
  onDeleteAddress?: (addressId: string) => void
  onSetDefault?: (addressId: string) => void
  className?: string
}

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

export function AddressForm({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefault,
  className,
}: AddressFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    division: 'Dhaka',
    postalCode: '',
    isDefault: false,
    deliveryZone: 'INSIDE_DHAKA' as 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingAddress) {
      onUpdateAddress?.(editingAddress.id, formData)
    } else {
      onAddAddress?.(formData as any)
    }

    setShowForm(false)
    setEditingAddress(null)
    resetForm()
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
      isDefault: false,
      deliveryZone: 'INSIDE_DHAKA',
    })
  }

  const handleDivisionChange = (division: string) => {
    setFormData((prev) => ({ ...prev, division, district: '', city: '' }))
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-primary">Shipping Address</h3>
        <Button variant="secondary" size="sm" onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {/* Address Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-card border-3 border-[var(--ink)] p-6 shadow-card space-y-4 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-body text-[var(--ink)]">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h4>
            <button type="button" onClick={() => { setShowForm(false); setEditingAddress(null); resetForm() }} className="text-[var(--ink)]/50 hover:text-primary">
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
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryZone: e.target.value as any }))}
              options={[
                { value: 'INSIDE_DHAKA', label: 'Inside Dhaka (60 BDT)' },
                { value: 'OUTSIDE_DHAKA', label: 'Outside Dhaka (120 BDT)' },
              ]}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4 text-primary border-2 border-[var(--ink)] rounded focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-[var(--ink)]">Set as default address</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--light)]">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingAddress(null); resetForm() }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      )}

      {/* Address List */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--ink)]/60 mb-4">No saved addresses</p>
            <Button variant="secondary" size="sm" onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </div>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedAddressId === address.id}
              onSelect={() => onSelectAddress(address.id)}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => onSetDefault?.(address.id)}
            />
          ))
        )}

        {/* New Address Button (when list not empty) */}
        {addresses.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { setEditingAddress(null); resetForm(); setShowForm(true) }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Address
          </Button>
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
}: {
  address: Address
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  const deliveryZoneLabels = {
    INSIDE_DHAKA: 'Inside Dhaka',
    OUTSIDE_DHAKA: 'Outside Dhaka',
  }

  return (
    <div
      className={`relative p-4 rounded-input border-3 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(255,107,107,0.2)]'
          : 'border-[var(--ink)]/30 hover:border-primary'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-medium text-body text-[var(--ink)]">{address.name}</span>
            {address.isDefault && (
              <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">Default</span>
            )}
            {address.deliveryZone === 'INSIDE_DHAKA' ? (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Inside Dhaka</span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Outside Dhaka</span>
            )}
          </div>
          <p className="text-body text-[var(--ink)] mb-1">{address.phone}</p>
          <p className="text-[var(--ink)]/70">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
            {`, ${address.city}, ${address.district}, ${address.division}`}
            {address.postalCode && ` - ${address.postalCode}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect() }}
            className={`p-2 rounded-input transition-colors ${
              isSelected ? 'bg-primary text-white' : 'bg-[var(--light)] text-[var(--ink)] hover:bg-dark/10'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="p-2 text-[var(--ink)]/50 hover:text-primary hover:bg-[var(--light)] rounded-input transition-colors" aria-label="Edit">
            ✏️
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-2 text-[var(--ink)]/50 hover:text-red-500 hover:bg-red-50 rounded-input transition-colors" aria-label="Delete">
            🗑️
          </button>
          {!address.isDefault && (
            <button onClick={(e) => { e.stopPropagation(); onSetDefault() }} className="p-2 text-[var(--ink)]/50 hover:text-primary hover:bg-[var(--light)] rounded-input transition-colors" aria-label="Set as default">
              ⭐
            </button>
          )}
        </div>
      </div>
    </div>
  )
}