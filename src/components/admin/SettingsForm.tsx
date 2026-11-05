'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { TaxConfig } from './TaxConfig'
import { DeliveryConfig } from './DeliveryConfig'
import { Settings, Tag, Truck, Mail, Globe, Bell, Shield, Users, Palette, DollarSign } from 'lucide-react'

interface SettingsFormProps {
  onSave: (settings: Record<string, any>) => Promise<void>
  initialSettings?: Record<string, any>
  className?: string
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-primary">Settings</h2>
          <p className="text-[var(--ink)]/60">Configure your store settings</p>
        </div>
        <div className="flex gap-3">
          {saved && <Badge variant="success" className="animate-fade-in">Saved!</Badge>}
          <Button type="submit" variant="primary" loading={submitting}>
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-5 bg-[var(--light)] rounded-input p-1">
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-1" /> General</TabsTrigger>
          <TabsTrigger value="tax"><Tag className="w-4 h-4 mr-1" /> Tax</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="w-4 h-4 mr-1" /> Delivery</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-4 h-4 mr-1" /> Email</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1" /> Appearance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-body text-[var(--ink)]">Store Information</h4>
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

            <div className="space-y-4">
              <h4 className="font-medium text-body text-[var(--ink)]">Localization</h4>
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

            <div className="space-y-4">
              <h4 className="font-medium text-body text-[var(--ink)]">Custom Requests</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generalSettings.customRequestEnabled}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, customRequestEnabled: e.target.checked }))}
                  className="w-4 h-4 text-primary border-2 border-[var(--ink)] rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-[var(--ink)]">Enable custom sticker requests</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-4">
              <h4 className="font-medium text-body text-[var(--ink)]">Maintenance</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) => setGeneralSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="w-4 h-4 text-primary border-2 border-[var(--ink)] rounded focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-[var(--ink)]">Enable maintenance mode</span>
              </label>
            </div>
          </div>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax">
          <TaxConfig onChange={(patch) => setGeneralSettings((prev) => ({ ...prev, ...patch }))} initialSettings={generalSettings} />
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <DeliveryConfig onChange={(patch) => setGeneralSettings((prev) => ({ ...prev, ...patch }))} initialSettings={generalSettings} />
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-body text-[var(--ink)]">SMTP Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="SMTP Host" value={emailSettings.smtpHost} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
              <Input label="SMTP Port" value={emailSettings.smtpPort} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: e.target.value }))} placeholder="587" />
              <Input label="SMTP Username" value={emailSettings.smtpUser} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpUser: e.target.value }))} placeholder="your-email@gmail.com" />
              <Input label="SMTP Password" type="password" value={emailSettings.smtpPassword} onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPassword: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="From Email" value={emailSettings.fromEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromEmail: e.target.value }))} placeholder="noreply@bioscope.com" />
              <Input label="From Name" value={emailSettings.fromName} onChange={(e) => setEmailSettings((prev) => ({ ...prev, fromName: e.target.value }))} placeholder="bioscope" />
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--light)] pt-6">
            <h4 className="font-medium text-body text-[var(--ink)]">Email Templates</h4>
            <Tabs defaultValue="order" onChange={() => {}}>
              <TabsList className="grid grid-cols-4 bg-[var(--light)] rounded-input p-1">
                <TabsTrigger value="order">Order Confirmation</TabsTrigger>
                <TabsTrigger value="status">Status Update</TabsTrigger>
                <TabsTrigger value="custom">Custom Request</TabsTrigger>
                <TabsTrigger value="welcome">Welcome</TabsTrigger>
              </TabsList>
              <TabsContent value="order">
                <Textarea label="Subject" value={emailSettings.orderConfirmation} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_confirmation_template: e.target.value }))} placeholder="Your order {{orderNumber}} has been confirmed!" rows={2} />
                <Textarea label="Body (HTML)" value={emailSettings.orderConfirmation} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_confirmation_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Thank you for your order..." rows={10} />
              </TabsContent>
              <TabsContent value="status">
                <Textarea label="Subject" value={emailSettings.orderStatusUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_status_template: e.target.value }))} placeholder="Your order {{orderNumber}} status updated" rows={2} />
                <Textarea label="Body (HTML)" value={emailSettings.orderStatusUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, order_status_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Your order status has changed to {{status}}..." rows={10} />
              </TabsContent>
              <TabsContent value="custom">
                <Textarea label="Subject" value={emailSettings.customRequestUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, custom_request_template: e.target.value }))} placeholder="Your custom sticker request has been updated" rows={2} />
                <Textarea label="Body (HTML)" value={emailSettings.customRequestUpdate} onChange={(e) => setEmailSettings((prev) => ({ ...prev, custom_request_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Your custom sticker request..." rows={10} />
              </TabsContent>
              <TabsContent value="welcome">
                <Textarea label="Subject" value={emailSettings.welcomeEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, welcome_template: e.target.value }))} placeholder="Welcome to bioscope!" rows={2} />
                <Textarea label="Body (HTML)" value={emailSettings.welcomeEmail} onChange={(e) => setEmailSettings((prev) => ({ ...prev, welcome_template: e.target.value }))} placeholder="Dear {{customerName}},<br><br>Welcome to our store..." rows={10} />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-body text-[var(--ink)]">Brand Colors</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1">Primary Color</label>
                <input
                  type="color"
                  value={appearanceSettings.primaryColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full h-12 rounded-input border-2 border-[var(--ink)]/30 cursor-pointer"
                />
                <Input
                  value={appearanceSettings.primaryColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1">Secondary Color</label>
                <input
                  type="color"
                  value={appearanceSettings.secondaryColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-full h-12 rounded-input border-2 border-[var(--ink)]/30 cursor-pointer"
                />
                <Input
                  value={appearanceSettings.secondaryColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                  className="mt-2 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1">Accent Color</label>
                <input
                  type="color"
                  value={appearanceSettings.accentColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="w-full h-12 rounded-input border-2 border-[var(--ink)]/30 cursor-pointer"
                />
                <Input
                  value={appearanceSettings.accentColor}
                  onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--light)] pt-6">
            <h4 className="font-medium text-body text-[var(--ink)]">Assets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1">Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
                />
                {appearanceSettings.logo && (
                  <img src={appearanceSettings.logo} alt="Logo preview" className="mt-2 h-16 rounded-input" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-1">Favicon</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-3 border-2 border-[var(--ink)]/30 rounded-input focus:border-primary focus:shadow-input"
                />
                {appearanceSettings.favicon && (
                  <img src={appearanceSettings.favicon} alt="Favicon preview" className="mt-2 w-16 h-16 rounded-input" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[var(--light)] pt-6">
            <h4 className="font-medium text-body text-[var(--ink)]">Custom CSS</h4>
            <Textarea
              label="Custom CSS (Advanced)"
              value={appearanceSettings.customCSS}
              onChange={(e) => setAppearanceSettings((prev) => ({ ...prev, customCSS: e.target.value }))}
              placeholder="/* Add your custom CSS here */"
              rows={10}
            />
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}