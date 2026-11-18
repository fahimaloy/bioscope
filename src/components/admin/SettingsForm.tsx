'use client'

import { useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { TaxConfig } from './TaxConfig'
import { DeliveryConfig } from './DeliveryConfig'
import { Settings, Tag, Truck, Mail, Globe, Palette, Save, Loader2, Image as ImageIcon, FileText, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { motion } from 'framer-motion'
import { SketchUnderline, StickerPeel } from '@/components/decorative/DoodleElements'
import { Checkbox } from '@/components/ui/Checkbox'

interface SettingsFormProps {
  onSave: (settings: SettingsData) => Promise<void>
  initialSettings?: SettingsData
  className?: string
}

interface SettingsData {
  site_name?: string
  site_currency?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  timezone?: string
  language?: string
  maintenance_mode?: boolean
  custom_request_enabled?: boolean
  custom_request_min_quantity?: number
  custom_request_max_dimension_cm?: number
  global_tax_percent?: number
  tax_inclusive_pricing?: boolean
  tax_categories?: Array<{ id: string; name: string; rate: number; description: string }>
  delivery_zones?: Array<{ id: string; name: string; districts: string[]; charge: number; days: string }>
  smtp_host?: string
  smtp_port?: string
  smtp_user?: string
  smtp_password?: string
  from_email?: string
  from_name?: string
  order_confirmation_template?: string
  order_status_template?: string
  custom_request_template?: string
  welcome_template?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  logo?: string
  favicon?: string
  custom_css?: string
}

export function SettingsForm({ onSave, initialSettings = {}, className }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'tax' | 'delivery' | 'email' | 'appearance'>('general')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const [generalSettings, setGeneralSettings] = useState({
    siteName: initialSettings.site_name || 'bioscope',
    siteCurrency: initialSettings.site_currency || 'BDT',
    contactEmail: initialSettings.contact_email || '',
    contactPhone: initialSettings.contact_phone || '',
    address: initialSettings.address || '',
    timezone: initialSettings.timezone || 'Asia/Dhaka',
    language: initialSettings.language || 'en',
    maintenanceMode: initialSettings.maintenance_mode || false,
    customRequestEnabled: initialSettings.custom_request_enabled !== false,
    customRequestMinQuantity: initialSettings.custom_request_min_quantity || 10,
    customRequestMaxDimension: initialSettings.custom_request_max_dimension_cm || 30,
  })

  const [taxSettings, setTaxSettings] = useState({
    global_tax_percent: initialSettings.global_tax_percent ?? 5,
    tax_inclusive_pricing: initialSettings.tax_inclusive_pricing ?? false,
    tax_categories: initialSettings.tax_categories ?? [],
  })

  const [deliverySettings, setDeliverySettings] = useState({
    delivery_zones: initialSettings.delivery_zones ?? [],
  })

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: initialSettings.smtp_host || '',
    smtpPort: initialSettings.smtp_port || '587',
    smtpUser: initialSettings.smtp_user || '',
    smtpPassword: initialSettings.smtp_password || '',
    fromEmail: initialSettings.from_email || '',
    fromName: initialSettings.from_name || 'bioscope',
    orderConfirmation: initialSettings.order_confirmation_template || '',
    orderStatusUpdate: initialSettings.order_status_template || '',
    customRequestUpdate: initialSettings.custom_request_template || '',
    welcomeEmail: initialSettings.welcome_template || '',
  })

  const [assetUpload, setAssetUpload] = useState<'logo' | 'favicon' | null>(null)

  const handleAssetUpload = (kind: 'logo' | 'favicon') => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = String(reader.result || '')
      setAssetUpload(kind)
      try {
        const res = await fetch(`/api/settings/logo?type=${kind}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Upload failed')
        setAppearanceSettings((prev) => ({ ...prev, [kind]: json?.data?.url ?? '' }))
        toast.success(kind === 'logo' ? 'Logo uploaded' : 'Favicon uploaded')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setAssetUpload(null)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: initialSettings.primary_color || 'var(--primary)',
    secondaryColor: initialSettings.secondary_color || 'var(--secondary)',
    accentColor: initialSettings.accent_color || 'var(--accent)',
    logo: initialSettings.logo || '',
    favicon: initialSettings.favicon || '',
    customCSS: initialSettings.custom_css || '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const allSettings = {
      ...generalSettings,
      ...taxSettings,
      ...deliverySettings,
      ...emailSettings,
      ...appearanceSettings,
    }

    try {
      await onSave(allSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSave} className={cn('space-y-6', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-display text-2xl text-primary">Settings</h2>
          <p className="text-[var(--text-subtle)]">Configure your store settings</p>
        </div>
        <div className="flex gap-3">
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Badge variant="success" className="animate-fade-in">
                Saved!
              </Badge>
            </motion.div>
          )}
          <Button type="submit" variant="doodle" loading={submitting} className="group">
            <Save className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-1" />
            <span>Save Changes</span>
            {submitting && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
            <StickerPeel />
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)} variant="pills">
        <TabsList className="flex flex-wrap gap-2 bg-[var(--light)] rounded-card p-1 mb-6">
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="tax"><Tag className="w-4 h-4 mr-1" /> Tax</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="w-4 h-4 mr-1" /> Delivery</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-4 h-4 mr-1" /> Email</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1" /> Appearance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Store Information" icon={<Settings className="w-5 h-5" />} iconColor="var(--primary)">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Store Name"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                  placeholder="bioscope"
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="support@bioscope.com"
                />
                <Input
                  label="Contact Phone"
                  value={generalSettings.contactPhone}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+8801XXXXXXXXX"
                />
                <Textarea
                  label="Address"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Store address for invoices"
                  rows={3}
                />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Localization" icon={<Globe className="w-5 h-5" />} iconColor="var(--secondary)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  label="Currency"
                  value={generalSettings.siteCurrency}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, siteCurrency: e.target.value }))}
                  options={[
                    { value: 'BDT', label: 'Bangladeshi Taka (BDT)' },
                    { value: 'USD', label: 'US Dollar (USD)' },
                    { value: 'EUR', label: 'Euro (EUR)' },
                  ]}
                />
                <Select
                  label="Timezone"
                  value={generalSettings.timezone}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                  options={[
                    { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)' },
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Asia/Kolkata', label: 'Kolkata (UTC+5:30)' },
                  ]}
                />
                <Select
                  label="Language"
                  value={generalSettings.language}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, language: e.target.value }))}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'bn', label: 'Bengali (বাংলা)' },
                  ]}
                />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Custom Requests" icon={<FileText className="w-5 h-5" />} iconColor="var(--accent)">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={generalSettings.customRequestEnabled}
                    onCheckedChange={(checked: boolean) => setGeneralSettings((prev) => ({ ...prev, customRequestEnabled: checked }))}
                  />
                  <span className="text-sm text-[var(--ink)]">Enable custom sticker requests</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Minimum Quantity"
                    type="number"
                    value={generalSettings.customRequestMinQuantity}
                    onChange={(e) => setGeneralSettings((prev) => ({ ...prev, customRequestMinQuantity: parseInt(e.target.value) || 1 }))}
                    min={1}
                  />
                  <Input
                    label="Max Dimension (cm)"
                    type="number"
                    value={generalSettings.customRequestMaxDimension}
                    onChange={(e) => setGeneralSettings((prev) => ({ ...prev, customRequestMaxDimension: parseInt(e.target.value) || 30 }))}
                    min={1}
                    max={100}
                  />
                </div>
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Maintenance" icon={<Wrench className="w-5 h-5" />} iconColor="var(--warning)">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked: boolean) => setGeneralSettings((prev) => ({ ...prev, maintenanceMode: checked }))}
                  />
                  <span className="text-sm text-[var(--ink)]">Enable maintenance mode</span>
                </label>
              </div>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="animate-fade-in">
          <TaxConfig onChange={(patch) => setTaxSettings((prev) => ({ ...prev, ...patch }))} initialSettings={taxSettings} />
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery" className="animate-fade-in">
          <DeliveryConfig onChange={(patch) => setDeliverySettings((prev) => ({ ...prev, ...patch }))} initialSettings={deliverySettings} />
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="SMTP Configuration" icon={<Mail className="w-5 h-5" />} iconColor="var(--primary)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="SMTP Host" value={emailSettings.smtpHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
                <Input label="SMTP Port" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: e.target.value }))} placeholder="587" />
                <Input label="SMTP Username" value={emailSettings.smtpUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpUser: e.target.value }))} placeholder="your-email@gmail.com" />
                <Input label="SMTP Password" type="password" value={emailSettings.smtpPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPassword: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <Input label="From Email" value={emailSettings.fromEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromEmail: e.target.value }))} placeholder="noreply@bioscope.com" />
                <Input label="From Name" value={emailSettings.fromName} onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromName: e.target.value }))} placeholder="bioscope" />
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Email Templates" icon={<FileText className="w-5 h-5" />} iconColor="var(--secondary)">
              <Tabs defaultValue="order" onChange={() => {}} variant="underline">
                <TabsList className="grid grid-cols-4 bg-[var(--light)] rounded-input p-1">
                  <TabsTrigger value="order">Order Confirmation</TabsTrigger>
                  <TabsTrigger value="status">Status Update</TabsTrigger>
                  <TabsTrigger value="custom">Custom Request</TabsTrigger>
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                </TabsList>
                <TabsContent value="order" className="space-y-4 pt-4">
                  <Textarea label="Subject" value={emailSettings.orderConfirmation} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_confirmation_template: e.target.value }))} placeholder="Your order {{orderNumber}} has been confirmed!" rows={2} />
                  <Textarea label="Body (HTML)" value={emailSettings.orderConfirmation} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_confirmation_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Thank you for your order..." rows={10} />
                </TabsContent>
                <TabsContent value="status" className="space-y-4 pt-4">
                  <Textarea label="Subject" value={emailSettings.orderStatusUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_status_template: e.target.value }))} placeholder="Your order {{orderNumber}} status updated" rows={2} />
                  <Textarea label="Body (HTML)" value={emailSettings.orderStatusUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_status_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Your order status has changed to {{status}}..." rows={10} />
                </TabsContent>
                <TabsContent value="custom" className="space-y-4 pt-4">
                  <Textarea label="Subject" value={emailSettings.customRequestUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, custom_request_template: e.target.value }))} placeholder="Your custom sticker request has been updated" rows={2} />
                  <Textarea label="Body (HTML)" value={emailSettings.customRequestUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, custom_request_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Your custom sticker request..." rows={10} />
                </TabsContent>
                <TabsContent value="welcome" className="space-y-4 pt-4">
                  <Textarea label="Subject" value={emailSettings.welcomeEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, welcome_template: e.target.value }))} placeholder="Welcome to bioscope!" rows={2} />
                  <Textarea label="Body (HTML)" value={emailSettings.welcomeEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, welcome_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Welcome to our store..." rows={10} />
                </TabsContent>
              </Tabs>
            </SectionCard>
          </motion.div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Brand Colors" icon={<Palette className="w-5 h-5" />} iconColor="var(--primary)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Primary Color</label>
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full h-12 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] cursor-pointer transition-all hover:border-primary"
                    />
                    <Input
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Secondary Color</label>
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={appearanceSettings.secondaryColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-full h-12 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] cursor-pointer transition-all hover:border-primary"
                    />
                    <Input
                      value={appearanceSettings.secondaryColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Accent Color</label>
                  <div className="space-y-2">
                    <input
                      type="color"
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="w-full h-12 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] cursor-pointer transition-all hover:border-primary"
                    />
                    <Input
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                      className="font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Assets" icon={<ImageIcon className="w-5 h-5" />} iconColor="var(--secondary)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Logo</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={assetUpload !== null}
                      onChange={handleAssetUpload('logo')}
                      className="w-full px-4 py-3 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input text-body"
                    />
                    {assetUpload === 'logo' && <p className="text-sm text-[var(--text-subtle)]">Uploading…</p>}
                    {appearanceSettings.logo && (
                      <span className="mt-2 inline-flex items-start gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={appearanceSettings.logo} alt="Logo preview" className="h-16 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_10%,transparent)]" />
                        <button type="button" onClick={() => setAppearanceSettings((prev) => ({ ...prev, logo: '' }))} className="text-xs text-error underline underline-offset-2">Remove</button>
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-2">Favicon</label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={assetUpload !== null}
                      onChange={handleAssetUpload('favicon')}
                      className="w-full px-4 py-3 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input focus:border-primary focus:shadow-input text-body"
                    />
                    {assetUpload === 'favicon' && <p className="text-sm text-[var(--text-subtle)]">Uploading…</p>}
                    {appearanceSettings.favicon && (
                      <span className="mt-2 inline-flex items-start gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={appearanceSettings.favicon} alt="Favicon preview" className="w-16 h-16 rounded-input border-2 border-[color-mix(in_srgb,var(--ink)_10%,transparent)]" />
                        <button type="button" onClick={() => setAppearanceSettings((prev) => ({ ...prev, favicon: '' }))} className="text-xs text-error underline underline-offset-2">Remove</button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 15 }}
          >
            <SectionCard title="Custom CSS" icon={<FileText className="w-5 h-5" />} iconColor="var(--accent)">
              <Textarea
                label="Custom CSS (Advanced)"
                value={appearanceSettings.customCSS}
                onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, customCSS: e.target.value }))}
                placeholder="/* Add your custom CSS here */"
                rows={10}
              />
            </SectionCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </form>
  )
}

interface SectionCardProps {
  title: string
  icon: React.ReactNode
  iconColor: string
  children: React.ReactNode
}

function SectionCard({ title, icon, iconColor, children }: SectionCardProps) {
  return (
    <Card variant="doodle" padding="lg" className="relative overflow-visible group">
      <StickerPeel />
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-input flex items-center justify-center animate-float-gentle transition-all duration-300 group-hover:scale-110', `bg-[${iconColor}]/10 text-[${iconColor}]`)}>
          {icon}
        </div>
        <SketchUnderline className="inline-block">
          <h3 className="font-display text-lg text-[var(--ink)]">{title}</h3>
        </SketchUnderline>
      </div>
      {children}
    </Card>
  )
}