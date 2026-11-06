'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@/lib/validations/auth'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsList, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { User, Lock, Camera, Save, Eye, EyeOff, MapPin, Plus, Trash2, Edit, Check, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'
import { motion } from 'framer-motion'
import { motionVariants } from '@/lib/motion'

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+8801700000000',
  avatar: null,
  role: 'CUSTOMER',
  emailVerified: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  addresses: [
    {
      id: '1',
      name: 'John Doe',
      phone: '+8801700000000',
      addressLine1: 'House 123, Road 45',
      addressLine2: 'Block A',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1207',
      country: 'Bangladesh',
      isDefault: true,
      deliveryZone: 'INSIDE_DHAKA' as const,
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+8801800000000',
      addressLine1: 'Apartment 4B, Green Tower',
      addressLine2: 'Mirpur Road',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1216',
      country: 'Bangladesh',
      isDefault: false,
      deliveryZone: 'INSIDE_DHAKA' as const,
    },
  ],
}

interface Address {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  district: string
  division: string
  postalCode: string
  country: string
  isDefault: boolean
  deliveryZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'
}

const tabsConfig = [
  { value: 'account', label: 'Account', icon: User },
  { value: 'addresses', label: 'Addresses', icon: MapPin },
  { value: 'notifications', label: 'Notifications', icon: Settings },
  { value: 'security', label: 'Security', icon: Lock },
] as const

type TabValue = (typeof tabsConfig)[number]['value']

function AddressCard({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault,
  isEditing = false,
  editFormData,
  onEditFormChange,
  onCancelEdit,
  onSaveEdit,
}: { 
  address: Address
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  isEditing?: boolean
  editFormData?: Partial<Address>
  onEditFormChange?: (field: string, value: string) => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
}) {
  if (isEditing && editFormData && onEditFormChange && onCancelEdit && onSaveEdit) {
    return (
      <Card key={address.id} variant="doodle" className="p-4" padding="none">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-primary">Edit Address</h3>
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-[var(--ink)]/50 hover:text-primary transition-colors"
              aria-label="Cancel editing"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={editFormData.name || ''}
              onChange={(e) => onEditFormChange('name', e.target.value)}
              error={!editFormData.name ? 'Name is required' : undefined}
            />
            <Input
              label="Phone"
              type="tel"
              value={editFormData.phone || ''}
              onChange={(e) => onEditFormChange('phone', e.target.value)}
              error={!editFormData.phone ? 'Phone is required' : undefined}
            />
          </div>
          
          <Input
            label="Address Line 1"
            value={editFormData.addressLine1 || ''}
            onChange={(e) => onEditFormChange('addressLine1', e.target.value)}
            error={!editFormData.addressLine1 ? 'Address is required' : undefined}
          />
          <Input
            label="Address Line 2 (Optional)"
            value={editFormData.addressLine2 || ''}
            onChange={(e) => onEditFormChange('addressLine2', e.target.value)}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={editFormData.city || ''}
              onChange={(e) => onEditFormChange('city', e.target.value)}
              error={!editFormData.city ? 'City is required' : undefined}
            />
            <Input
              label="District"
              value={editFormData.district || ''}
              onChange={(e) => onEditFormChange('district', e.target.value)}
              error={!editFormData.district ? 'District is required' : undefined}
            />
            <Input
              label="Postal Code"
              value={editFormData.postalCode || ''}
              onChange={(e) => onEditFormChange('postalCode', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Division"
              value={editFormData.division || ''}
              onChange={(e) => onEditFormChange('division', e.target.value)}
              error={!editFormData.division ? 'Division is required' : undefined}
            />
            <Input
              label="Country"
              value={editFormData.country || ''}
              onChange={(e) => onEditFormChange('country', e.target.value)}
              error={!editFormData.country ? 'Country is required' : undefined}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--light)]">
            <Button variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            <Button variant="doodle" onClick={onSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card key={address.id} variant="doodle" className="p-4" padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-medium text-body text-[var(--ink)]">{address.name}</span>
              {address.isDefault && (
                <Badge variant="doodle" size="sm">Default</Badge>
              )}
              <Badge variant={address.deliveryZone === 'INSIDE_DHAKA' ? 'success' : 'secondary'} size="sm">
                {address.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}
              </Badge>
            </div>
            <p className="text-body text-[var(--ink)]/70">{address.phone}</p>
            <p className="text-[var(--ink)]/60 mt-1">
              {address.addressLine1}
              {address.addressLine2 && `, ${address.addressLine2}`}
              <br />
              {address.city}, {address.district}, {address.division}
              {address.postalCode && ` - ${address.postalCode}`}
              <br />
              {address.country}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            {!address.isDefault && (
              <Button variant="ghost" size="sm" onClick={onSetDefault}>
                <Check className="w-4 h-4 mr-1" />
                Set Default
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function AddAddressForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (data: Address) => void }) {
  const form = useForm<Address>({
    resolver: zodResolver(
      updateProfileSchema.extend({
        addressLine1: updateProfileSchema.shape.phone,
        addressLine2: updateProfileSchema.shape.phone.optional(),
        city: updateProfileSchema.shape.phone,
        district: updateProfileSchema.shape.phone,
        division: updateProfileSchema.shape.phone,
        postalCode: updateProfileSchema.shape.phone.optional(),
        country: updateProfileSchema.shape.phone,
      })
    ),
    defaultValues: {
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      division: '',
      postalCode: '',
      country: 'Bangladesh',
      isDefault: false,
      deliveryZone: 'INSIDE_DHAKA',
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data as Address)
    form.reset()
  })

  return (
    <Card variant="doodle" className="p-4" padding="none">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-primary">Add New Address</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-[var(--ink)]/50 hover:text-primary transition-colors"
            aria-label="Cancel adding address"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />
            <Input
              label="Phone"
              type="tel"
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />
          </div>
          
          <Input
            label="Address Line 1"
            {...form.register('addressLine1')}
            error={form.formState.errors.addressLine1?.message}
          />
          <Input
            label="Address Line 2 (Optional)"
            {...form.register('addressLine2')}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              {...form.register('city')}
              error={form.formState.errors.city?.message}
            />
            <Input
              label="District"
              {...form.register('district')}
              error={form.formState.errors.district?.message}
            />
            <Input
              label="Postal Code"
              {...form.register('postalCode')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Division"
              {...form.register('division')}
              error={form.formState.errors.division?.message}
            />
            <Input
              label="Country"
              {...form.register('country')}
              error={form.formState.errors.country?.message}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--light)]">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="doodle">
              <Save className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  date: string
  items: number
}

function OrderHistoryCard({ order }: { order: Order }) {
  return (
    <Card key={order.id} variant="doodle" className="p-4" padding="none">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-input overflow-hidden bg-[var(--light)] border border-[var(--ink)]/20">
              <div className="w-full h-full flex items-center justify-center text-[var(--ink)]/30">📦</div>
            </div>
            <div>
              <p className="font-medium text-body text-[var(--ink)]">{order.orderNumber}</p>
              <p className="text-sm text-[var(--ink)]/50">{order.items} items • {order.total.toLocaleString()} BDT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--ink)]/50">{order.date}</span>
            <Badge variant={order.status === 'DELIVERED' ? 'success' : 'secondary'} size="sm">{order.status}</Badge>
            <a href={`/orders/${order.id}`}>
              <Button variant="ghost" size="sm">View</Button>
            </a>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SecurityTips() {
  return (
    <Card variant="doodle" className="p-6">
      <h3 className="font-display text-lg text-primary mb-4">Security Tips</h3>
      <ul className="space-y-3 text-[var(--ink)]/70">
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
          Use a unique, strong password
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">2</span>
          Enable 2FA when available
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">3</span>
          Never share your password
        </li>
        <li className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">4</span>
          Log out from shared devices
        </li>
      </ul>
    </Card>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPromotions: true,
    emailNewsletter: false,
    pushOrders: true,
    pushPromotions: false,
    smsOrders: false,
    smsDelivery: true,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const notificationOptions = [
    { key: 'emailOrders', label: 'Order Confirmations', description: 'Receive email when you place an order', category: 'Email' },
    { key: 'emailPromotions', label: 'Promotional Offers', description: 'Get notified about sales and discounts', category: 'Email' },
    { key: 'emailNewsletter', label: 'Newsletter', description: 'Weekly updates and new arrivals', category: 'Email' },
    { key: 'pushOrders', label: 'Order Updates', description: 'Push notifications for order status changes', category: 'Push' },
    { key: 'pushPromotions', label: 'Flash Sales', description: 'Real-time alerts for limited-time offers', category: 'Push' },
    { key: 'smsOrders', label: 'Order SMS', description: 'SMS confirmation for orders', category: 'SMS' },
    { key: 'smsDelivery', label: 'Delivery Updates', description: 'SMS when your order is out for delivery', category: 'SMS' },
  ]

  const categories = ['Email', 'Push', 'SMS']

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category} variant="doodle" className="p-4" padding="none">
          <div className="p-4">
            <h3 className="font-display text-lg text-primary mb-4">{category} Notifications</h3>
            <div className="space-y-3">
              {notificationOptions
                .filter((opt) => opt.category === category)
                .map((opt) => (
                  <label key={opt.key} className="flex items-center justify-between cursor-pointer p-3 rounded-input hover:bg-[var(--light)] transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-body text-[var(--ink)]">{opt.label}</p>
                      <p className="text-sm text-[var(--ink)]/50">{opt.description}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[opt.key as keyof typeof notifications]}
                      onClick={() => toggleNotification(opt.key as keyof typeof notifications)}
                      className={cn(
                        'relative w-11 h-6 rounded-pill border-3 transition-all duration-200',
                        notifications[opt.key as keyof typeof notifications]
                          ? 'bg-primary border-primary'
                          : 'bg-[var(--ink)]/20 border-[var(--ink)]/30'
                      )}
                      aria-label={opt.label}
                    >
                      <span
                        className={cn(
                          'absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                          notifications[opt.key as keyof typeof notifications]
                            ? 'translate-x-5'
                            : 'translate-x-[2px]'
                        )}
                      />
                    </button>
                  </label>
                ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <motion.div
        variants={motionVariants.staggerContainer}
        initial="initial"
        animate="animate"
      >
        <NotificationSettings />
      </motion.div>
    </div>
  )
}

function AddressesTab({ user }: { user: typeof mockUser }) {
  const [addresses, setAddresses] = useState<Address[]>(user.addresses)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Address>>({})
  const [showAddForm, setShowAddForm] = useState(false)

  const handleEdit = (address: Address) => {
    setEditingId(address.id)
    setEditFormData({ ...address })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({})
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveEdit = () => {
    if (editingId && editFormData.name && editFormData.phone && editFormData.addressLine1) {
      setAddresses((prev) =>
        prev.map((addr) =>
          addr.id === editingId ? { ...addr, ...editFormData } as Address : addr
        )
      )
      setEditingId(null)
      setEditFormData({})
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setAddresses((prev) => prev.filter((addr) => addr.id !== id))
    }
  }

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({ ...addr, isDefault: addr.id === id }))
    )
  }

  const handleAddAddress = (data: Address) => {
    const newAddress: Address = {
      ...data,
      id: Date.now().toString(),
      isDefault: addresses.length === 0,
    }
    setAddresses((prev) => [...prev, newAddress])
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <motion.div
        variants={motionVariants.staggerContainer}
        initial="initial"
        animate="animate"
      >
        {!showAddForm ? (
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-primary">Saved Addresses</h2>
            <Button variant="doodle" size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          </div>
        ) : (
          <AddAddressForm onCancel={() => setShowAddForm(false)} onSubmit={handleAddAddress} />
        )}

        <div className="space-y-4">
          {addresses.map((address) => (
            <motion.div key={address.id} variants={motionVariants.staggerItem}>
              <AddressCard
                address={address}
                onEdit={() => handleEdit(address)}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
                isEditing={editingId === address.id}
                editFormData={editFormData}
                onEditFormChange={handleEditFormChange}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function AccountTab({ user }: { user: typeof mockUser }) {
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)
  const [isLoading, setIsLoading] = useState(false)

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  })

  const handleProfileSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true)
    try {
      // await updateProfile(data)
      console.log('Profile updated:', data)
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = (files: File[]) => {
    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatar(e.target?.result as string)
      }
      reader.readAsDataURL(files[0])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <motion.div
      variants={motionVariants.staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <Card variant="doodle" className="p-6" padding="none">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-3 border-[var(--ink)]" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-3 border-[var(--ink)]">
                  <span className="text-3xl font-display text-primary">{getInitials(user?.name || 'User')}</span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors border-3 border-[var(--surface-card)] shadow-btn">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleAvatarUpload(Array.from(e.target.files))}
                  className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
                />
              </label>
            </div>
            <div>
              <h2 className="font-display text-2xl text-[var(--ink)]">{user?.name || 'User'}</h2>
              <p className="text-[var(--ink)]/60">{user?.email}</p>
              <Badge variant="outline" size="sm" className="mt-2 inline-block">
                {user?.role === 'ADMIN' ? 'Admin' : 'Customer'}
              </Badge>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              {...profileForm.register('name')}
              error={profileForm.formState.errors.name?.message}
              disabled={isLoading}
            />
            <Input
              label="Phone Number"
              type="tel"
              {...profileForm.register('phone')}
              error={profileForm.formState.errors.phone?.message}
              disabled={isLoading}
            />
            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-[var(--light)]"
            />
            <p className="text-sm text-[var(--ink)]/50">Email cannot be changed. Contact support if needed.</p>

            <div className="flex justify-end pt-4 border-t border-[var(--light)]">
              <Button type="submit" size="lg" variant="doodle" loading={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>

          <div className="p-4 bg-[var(--light)] rounded-input border border-[var(--ink)]/20">
            <h3 className="font-medium text-body text-[var(--ink)] mb-2">Account Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--ink)]/50">Member Since</p>
                <p className="font-medium">{formatDate(user?.createdAt || new Date())}</p>
              </div>
              <div>
                <p className="text-[var(--ink)]/50">Email Verified</p>
                <p className="font-medium">{user?.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function SecurityTab() {
  const [isLoading, setIsLoading] = useState(false)

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handlePasswordSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      console.log('Password changed successfully!')
      passwordForm.reset()
    } catch (error) {
      console.error('Failed to change password:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      variants={motionVariants.staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <Card variant="doodle" className="p-6" padding="none">
        <div className="p-6 space-y-4">
          <h2 className="font-display text-xl text-primary">Change Password</h2>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                {...passwordForm.register('currentPassword')}
                error={passwordForm.formState.errors.currentPassword?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-[38px] text-[var(--ink)]/50 hover:text-primary transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                {...passwordForm.register('newPassword')}
                error={passwordForm.formState.errors.newPassword?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[38px] text-[var(--ink)]/50 hover:text-primary transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                {...passwordForm.register('confirmPassword')}
                error={passwordForm.formState.errors.confirmPassword?.message}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[38px] text-[var(--ink)]/50 hover:text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--light)]">
              <Button type="submit" size="lg" variant="doodle" loading={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <SecurityTips />
    </motion.div>
  )
}

function OrdersTab() {
  return (
    <motion.div
      variants={motionVariants.staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl text-primary">Order History</h2>
        <a href="/orders">
          <Button variant="outline" size="sm">View All Orders</Button>
        </a>
      </div>

      <div className="space-y-4">
        {[
          { id: '1', orderNumber: 'ORD-2024-001', status: 'DELIVERED', total: 1250, date: '2024-01-15', items: 2 },
          { id: '2', orderNumber: 'ORD-2024-002', status: 'SHIPPED', total: 850, date: '2024-01-20', items: 1 },
        ].map((order) => (
          <motion.div key={order.id} variants={motionVariants.staggerItem}>
            <OrderHistoryCard order={order} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string>('account')

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <DoodleScatter count={3} />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl text-primary mb-2">My Profile</h1>
          <p className="text-[var(--ink)]/60">Manage your account settings</p>
        </motion.div>

        <Tabs defaultValue={activeTab} onChange={setActiveTab} variant="pills">
          <TabsList className="grid w-full grid-cols-4 bg-[var(--light)] rounded-card p-1 mb-6" role="tablist">
            {tabsConfig.map((tab, index) => (
              <motion.button
                key={tab.value}
                variants={motionVariants.staggerItem}
                custom={index}
                role="tab"
                aria-selected={activeTab === tab.value}
                aria-controls={`tabs-content-${tab.value}`}
                id={`tabs-trigger-${tab.value}`}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative px-4 py-3 rounded-[30px] text-body font-medium transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)]',
                  activeTab === tab.value
                    ? 'bg-white text-primary shadow-btn'
                    : 'text-[var(--ink)]/70 hover:text-[var(--ink)] hover:bg-white/50'
                )}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </motion.button>
            ))}
          </TabsList>

          <TabsContent value="account" className="animate-fade-in">
            <AccountTab user={mockUser} />
          </TabsContent>

          <TabsContent value="addresses" className="animate-fade-in">
            <AddressesTab user={mockUser} />
          </TabsContent>

          <TabsContent value="notifications" className="animate-fade-in">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="security" className="animate-fade-in">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="orders" className="animate-fade-in">
            <OrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}