'use client'

// Profile — real account data (2026-11-19, rebuild task 2.8 / plan B1).
//
// The previous version rendered a hardcoded placeholder user to every customer:
// profile save was a console.log, address CRUD was local state only, and the
// orders tab was hardcoded. Everything here now talks to the real APIs:
//   GET/PATCH /api/user/me            → { user }
//   POST      /api/addresses          → { address }
//   PATCH     /api/addresses/[id]     → { address }   (isDefault clears others)
//   DELETE    /api/addresses/[id]     → 409 IN_USE when orders reference it
//   POST      /api/auth/change-password
//
// Deliberate removals (recorded in the ledger): the Notifications tab had no
// persistence backend (toggles reset on reload), the Orders tab was dead mock
// data (the real /orders page exists — the account tab links to it with real
// counts), and avatar upload is hidden until a customer upload route exists.

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { User, MapPin, Lock, Save, Eye, EyeOff, Plus, Trash2, Edit, Check, X, ShoppingBag, Palette, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { WashiTape } from '@/components/decorative'
import { formatDate } from '@/lib/utils'
import { motionVariants } from '@/lib/motion'
import { addressSchema } from '@/lib/validations/order'
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput } from '@/lib/validations/profile'

interface Address {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  district: string
  division: string
  postalCode?: string | null
  country: string
  isDefault: boolean
  deliveryZone: 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA'
}

interface ProfileUser {
  id: string
  email: string
  name: string | null
  role: string
  phone: string | null
  avatar: string | null
  emailVerified: string | null
  createdAt: string
  addresses: Address[]
  _count: { orders: number; customRequests: number; reviews: number }
}

type ApiError = Error & { code?: string; status?: number }

/** Fetch a route envelope; throws with the server's message/code on failure. */
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    const err = new Error(json?.error || 'Something went wrong') as ApiError
    err.code = json?.code
    err.status = res.status
    throw err
  }
  return json.data as T
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh']

const selectClass =
  'w-full min-h-[44px] rounded-[var(--radius-md)] border-2 border-[var(--ink)] bg-[var(--surface-raised)] px-3 py-2 text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none'

function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

function AccountTab({ user, onUpdated }: { user: ProfileUser; onUpdated: (patch: Partial<ProfileUser>) => void }) {
  const [saving, setSaving] = useState(false)
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name ?? '', phone: user.phone ?? '' },
  })

  const handleSave = async (data: UpdateProfileInput) => {
    setSaving(true)
    try {
      const result = await api<{ user: Partial<ProfileUser> }>('/api/user/me', jsonInit('PATCH', data))
      onUpdated(result.user)
      toast.success('Profile updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div variants={motionVariants.staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <Card variant="doodle" padding="lg">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="h-20 w-20 rounded-full border-[3px] border-[var(--ink)] object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[var(--ink)] bg-[var(--paper-deep)]">
                <span className="font-display text-2xl text-[var(--ink)]">{getInitials(user.name)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-2xl text-[var(--ink)]">{user.name || 'Customer'}</h2>
              <p className="truncate text-[var(--text-subtle)]">{user.email}</p>
              <Badge variant="outline" size="sm" className="mt-2 inline-block">
                {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
              </Badge>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <Input
              label="Full Name"
              {...form.register('name')}
              error={form.formState.errors.name?.message}
              disabled={saving}
            />
            <Input
              label="Phone Number"
              type="tel"
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
              disabled={saving}
            />
            <Input label="Email" type="email" value={user.email} disabled />
            <p className="text-sm text-[var(--text-subtle)]">Email cannot be changed. Contact support if needed.</p>
            <div className="flex justify-end border-t-2 border-[var(--paper-deep)] pt-4">
              <Button type="submit" variant="doodle" loading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>

          <div className="rounded-[var(--radius-md)] border-2 border-[var(--paper-deep)] bg-[var(--paper)] p-4">
            <h3 className="mb-3 font-medium text-[var(--ink)]">Account Info</h3>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[var(--text-subtle)]">Member Since</p>
                <p className="font-medium text-[var(--ink)]">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-[var(--text-subtle)]">Email Verified</p>
                <p className="font-medium text-[var(--ink)]">{user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-[var(--paper-deep)] pt-4 text-center">
              <Link href="/orders" className="rounded-[var(--radius-md)] p-2 transition-colors hover:bg-[var(--paper-deep)]">
                <ShoppingBag className="mx-auto mb-1 h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
                <p className="font-display text-lg text-[var(--ink)]">{user._count.orders}</p>
                <p className="text-xs text-[var(--text-subtle)]">Orders</p>
              </Link>
              <Link href="/custom-sticker" className="rounded-[var(--radius-md)] p-2 transition-colors hover:bg-[var(--paper-deep)]">
                <Palette className="mx-auto mb-1 h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
                <p className="font-display text-lg text-[var(--ink)]">{user._count.customRequests}</p>
                <p className="text-xs text-[var(--text-subtle)]">Custom Requests</p>
              </Link>
              <div className="p-2">
                <Star className="mx-auto mb-1 h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
                <p className="font-display text-lg text-[var(--ink)]">{user._count.reviews}</p>
                <p className="text-xs text-[var(--text-subtle)]">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Addresses                                                           */
/* ------------------------------------------------------------------ */

type AddressFormValues = z.input<typeof addressSchema>

function AddressForm({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: Address
  busy: boolean
  onSubmit: (values: AddressFormValues) => void
  onCancel: () => void
}) {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          phone: initial.phone,
          addressLine1: initial.addressLine1,
          addressLine2: initial.addressLine2 ?? '',
          city: initial.city,
          district: initial.district,
          division: initial.division,
          postalCode: initial.postalCode ?? '',
          country: initial.country,
          isDefault: initial.isDefault,
          deliveryZone: initial.deliveryZone,
        }
      : {
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
          deliveryZone: 'INSIDE_DHAKA',
        },
  })

  return (
    <Card variant="doodle" padding="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-[var(--ink)]">{initial ? 'Edit Address' : 'Add New Address'}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[var(--radius-sm)] p-1 text-[var(--text-subtle)] transition-colors hover:text-[var(--ink)]"
            aria-label="Cancel address form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" {...form.register('name')} error={form.formState.errors.name?.message} disabled={busy} />
            <Input label="Phone" type="tel" {...form.register('phone')} error={form.formState.errors.phone?.message} disabled={busy} />
          </div>
          <Input
            label="Address Line 1"
            {...form.register('addressLine1')}
            error={form.formState.errors.addressLine1?.message}
            disabled={busy}
          />
          <Input label="Address Line 2 (Optional)" {...form.register('addressLine2')} disabled={busy} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="City" {...form.register('city')} error={form.formState.errors.city?.message} disabled={busy} />
            <Input label="District" {...form.register('district')} error={form.formState.errors.district?.message} disabled={busy} />
            <Input
              label="Postal Code"
              {...form.register('postalCode', { setValueAs: (v) => (v === '' ? undefined : v) })}
              error={form.formState.errors.postalCode?.message}
              disabled={busy}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="address-division" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Division
              </label>
              <select id="address-division" className={selectClass} {...form.register('division')} disabled={busy}>
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="address-zone" className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                Delivery Zone
              </label>
              <select id="address-zone" className={selectClass} {...form.register('deliveryZone')} disabled={busy}>
                <option value="INSIDE_DHAKA">Inside Dhaka</option>
                <option value="OUTSIDE_DHAKA">Outside Dhaka</option>
              </select>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--ink)]">
            <Checkbox
              checked={form.watch('isDefault') === true}
              onCheckedChange={(checked) => form.setValue('isDefault', checked === true)}
              aria-label="Set as default address"
            />
            Set as default address
          </label>
          <div className="flex flex-wrap justify-end gap-2 border-t-2 border-[var(--paper-deep)] pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="doodle" loading={busy}>
              <Save className="mr-2 h-4 w-4" />
              {initial ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
}

function AddressCard({
  address,
  busy,
  confirmingDelete,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onSetDefault,
}: {
  address: Address
  busy: boolean
  confirmingDelete: boolean
  onEdit: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <Card variant="doodle" padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--ink)]">{address.name}</span>
            {address.isDefault && <Badge variant="doodle" size="sm">Default</Badge>}
            <Badge variant={address.deliveryZone === 'INSIDE_DHAKA' ? 'success' : 'secondary'} size="sm">
              {address.deliveryZone === 'INSIDE_DHAKA' ? 'Inside Dhaka' : 'Outside Dhaka'}
            </Badge>
          </div>
          <p className="text-[var(--text-muted)]">{address.phone}</p>
          <p className="mt-1 text-[var(--text-subtle)]">
            {address.addressLine1}
            {address.addressLine2 ? `, ${address.addressLine2}` : ''}
            <br />
            {address.city}, {address.district}, {address.division}
            {address.postalCode ? ` - ${address.postalCode}` : ''}
            <br />
            {address.country}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirmingDelete ? (
            <>
              <span className="text-sm text-[var(--error)]">Delete this address?</span>
              <Button type="button" variant="doodle" size="sm" onClick={onConfirmDelete} loading={busy}>
                Confirm
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelDelete} disabled={busy}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={onEdit} disabled={busy}>
                <Edit className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[var(--error)] hover:bg-[color-mix(in_srgb,var(--error)_10%,transparent)]"
                onClick={onDelete}
                disabled={busy}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
              {!address.isDefault && (
                <Button type="button" variant="ghost" size="sm" onClick={onSetDefault} disabled={busy}>
                  <Check className="mr-1 h-4 w-4" />
                  Set Default
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function AddressesTab({ user, onRefresh }: { user: ProfileUser; onRefresh: () => Promise<void> }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const addresses = user.addresses

  const handleAdd = async (values: AddressFormValues) => {
    setBusy(true)
    try {
      await api<{ address: Address }>('/api/addresses', jsonInit('POST', values))
      toast.success('Address added')
      setShowAddForm(false)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add address')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (id: string, values: AddressFormValues) => {
    setBusy(true)
    try {
      await api<{ address: Address }>(`/api/addresses/${id}`, jsonInit('PATCH', values))
      toast.success('Address updated')
      setEditingId(null)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update address')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setBusy(true)
    try {
      await api<{ message: string }>(`/api/addresses/${id}`, { method: 'DELETE' })
      toast.success('Address deleted')
      setConfirmingDeleteId(null)
      await onRefresh()
    } catch (error) {
      const err = error as ApiError
      toast.error(err.code === 'IN_USE' ? 'This address is used by existing orders and cannot be deleted' : err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    setBusy(true)
    try {
      await api<{ address: Address }>(`/api/addresses/${id}`, jsonInit('PATCH', { isDefault: true }))
      toast.success('Default address updated')
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to set default address')
    } finally {
      setBusy(false)
    }
  }

  const editing = addresses.find((a) => a.id === editingId)

  return (
    <motion.div variants={motionVariants.staggerContainer} initial="initial" animate="animate" className="space-y-6">
      {!showAddForm && !editing && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-[var(--ink)]">Saved Addresses</h2>
          <Button type="button" variant="doodle" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        </div>
      )}

      {showAddForm && <AddressForm busy={busy} onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />}
      {editing && (
        <AddressForm
          key={editing.id}
          initial={editing}
          busy={busy}
          onSubmit={(values) => handleEdit(editing.id, values)}
          onCancel={() => setEditingId(null)}
        />
      )}

      {addresses.length === 0 && !showAddForm ? (
        <Card variant="doodle" padding="lg">
          <div className="py-8 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-[var(--text-subtle)]" aria-hidden="true" />
            <p className="font-medium text-[var(--ink)]">No saved addresses yet</p>
            <p className="mt-1 text-sm text-[var(--text-subtle)]">Add one to speed up checkout.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <motion.div key={address.id} variants={motionVariants.staggerItem}>
              {editingId !== address.id && (
                <AddressCard
                  address={address}
                  busy={busy}
                  confirmingDelete={confirmingDeleteId === address.id}
                  onEdit={() => {
                    setEditingId(address.id)
                    setShowAddForm(false)
                  }}
                  onDelete={() => setConfirmingDeleteId(address.id)}
                  onConfirmDelete={() => handleDelete(address.id)}
                  onCancelDelete={() => setConfirmingDeleteId(null)}
                  onSetDefault={() => handleSetDefault(address.id)}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Security                                                            */
/* ------------------------------------------------------------------ */

const passwordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }) })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

type PasswordFormValues = z.input<typeof passwordFormSchema>

function SecurityTab() {
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const handleSubmit = async (values: PasswordFormValues) => {
    setSaving(true)
    try {
      await api<{ message: string }>(
        '/api/auth/change-password',
        jsonInit('POST', { currentPassword: values.currentPassword, newPassword: values.newPassword })
      )
      toast.success('Password updated')
      form.reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const toggleClass =
    'absolute right-3 top-[38px] rounded-[var(--radius-sm)] p-1 text-[var(--text-subtle)] transition-colors hover:text-[var(--ink)]'

  return (
    <motion.div variants={motionVariants.staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <Card variant="doodle" padding="lg">
        <div className="space-y-4">
          <h2 className="font-display text-xl text-[var(--ink)]">Change Password</h2>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="max-w-md space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                {...form.register('currentPassword')}
                error={form.formState.errors.currentPassword?.message}
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className={toggleClass}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                {...form.register('newPassword')}
                error={form.formState.errors.newPassword?.message}
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className={toggleClass}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                {...form.register('confirmPassword')}
                error={form.formState.errors.confirmPassword?.message}
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={toggleClass}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-end border-t-2 border-[var(--paper-deep)] pt-4">
              <Button type="submit" variant="doodle" loading={saving}>
                <Save className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <Card variant="doodle" padding="lg">
        <h3 className="mb-4 font-display text-lg text-[var(--ink)]">Security Tips</h3>
        <ul className="space-y-3 text-[var(--text-muted)]">
          {['Use a unique, strong password', 'Never share your password', 'Log out from shared devices'].map((tip, i) => (
            <li key={tip} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--paper-deep)] text-sm text-[var(--ink)]">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading')

  const load = useCallback(async () => {
    setLoadState('loading')
    try {
      const data = await api<{ user: ProfileUser }>('/api/user/me')
      setUser(data.user)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleUpdated = useCallback((patch: Partial<ProfileUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  return (
    <div className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-4xl">
        <motion.div variants={motionVariants.pageEnter} initial="initial" animate="animate" className="relative mb-8">
          <WashiTape rotation={-2} width={120} height={24} className="absolute -top-5 left-2" />
          <h1 className="font-display text-3xl text-[var(--ink)]">My Profile</h1>
          <p className="mt-1 text-[var(--text-subtle)]">Manage your account settings</p>
        </motion.div>

        {loadState === 'loading' && (
          <div className="space-y-4" data-testid="profile-loading">
            <Skeleton className="h-12 w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
          </div>
        )}

        {loadState === 'error' && (
          <Card variant="doodle" padding="lg">
            <div className="py-8 text-center">
              <p className="font-medium text-[var(--ink)]">Could not load your profile</p>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Check your connection and try again.</p>
              <Button type="button" variant="doodle" className="mt-4" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {loadState === 'ready' && user && (
          <Tabs defaultValue="account" variant="pills">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="account">
                <User className="mr-1 h-4 w-4" aria-hidden="true" />
                Account
              </TabsTrigger>
              <TabsTrigger value="addresses">
                <MapPin className="mr-1 h-4 w-4" aria-hidden="true" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="mr-1 h-4 w-4" aria-hidden="true" />
                Security
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <AccountTab user={user} onUpdated={handleUpdated} />
            </TabsContent>
            <TabsContent value="addresses">
              <AddressesTab user={user} onRefresh={load} />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
