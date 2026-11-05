'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@/lib/validations/auth'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { formatDate } from '@/lib/utils'
import { User, Mail, Lock, Camera, Save, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DoodleScatter } from '@/components/decorative/DoodleScatter'

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
      deliveryZone: 'INSIDE_DHAKA',
    },
  ],
}

function AddressCard({ address }: { address: any }) {
  return (
    <Card key={address.id} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-medium text-body text-[var(--ink)]">{address.name}</span>
            {address.isDefault && (
              <Badge variant="primary" size="sm">Default</Badge>
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
        <div className="flex items-center gap-2 ml-4">
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50">Delete</Button>
          {!address.isDefault && (
            <Button variant="ghost" size="sm">Set Default</Button>
          )}
        </div>
      </div>
    </Card>
  )
}

function OrderHistoryCard({ order }: { order: any }) {
  return (
    <Card key={order.id} className="p-4">
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
    </Card>
  )
}

function SecurityTips() {
  return (
    <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
      <h3 className="font-display text-lg text-yellow-800 mb-2">Security Tips</h3>
      <ul className="space-y-2 text-yellow-700">
        <li className="flex items-center gap-2">Use a unique, strong password</li>
        <li className="flex items-center gap-2">Enable 2FA when available</li>
        <li className="flex items-center gap-2">Never share your password</li>
        <li className="flex items-center gap-2">Log out from shared devices</li>
      </ul>
    </Card>
  )
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'orders'>('profile')
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  })

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

  const handleProfileSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true)
    setMessage(null)
    try {
      await updateProfile(data)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (data: ChangePasswordInput) => {
    setIsLoading(true)
    setMessage(null)
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

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      passwordForm.reset()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to change password' })
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
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <DoodleScatter count={3} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-primary mb-2">My Profile</h1>
          <p className="text-[var(--ink)]/60">Manage your account settings</p>
        </div>

        {message && (
          <div className={cn(
            'mb-6 p-4 rounded-input border text-sm flex items-center gap-2',
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          )} role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {message.text}
          </div>
        )}

        <Tabs defaultValue={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 bg-[var(--light)] rounded-input p-1 mb-6">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" /> Profile</TabsTrigger>
            <TabsTrigger value="addresses"><Mail className="w-4 h-4 mr-1" /> Addresses</TabsTrigger>
            <TabsTrigger value="security"><Lock className="w-4 h-4 mr-1" /> Security</TabsTrigger>
            <TabsTrigger value="orders"><Eye className="w-4 h-4 mr-1" /> Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-display text-primary">{getInitials(user?.name || 'User')}</span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleAvatarUpload(Array.from(e.target.files))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
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
                  <Button type="submit" size="lg" loading={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-[var(--light)] rounded-input border border-[var(--ink)]/20">
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
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-primary">Saved Addresses</h2>
              <Button variant="primary" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            </div>

            <div className="space-y-4">
              {mockUser.addresses.map((address) => (
                <AddressCard key={address.id} address={address} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-xl text-primary mb-6">Change Password</h2>
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
                  <Button type="submit" size="lg" loading={isLoading}>
                    {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>

            <SecurityTips />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
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
                <OrderHistoryCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}