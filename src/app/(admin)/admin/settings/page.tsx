'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Settings, Tag, Truck, Mail, Palette, Globe, Bell, Shield, Users, DollarSign, CheckCircle, Save, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SketchUnderline, StickerPeel, DoodleShape } from '@/components/decorative/DoodleElements'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const tabs = [
  { value: 'general', label: 'General', icon: Settings },
  { value: 'tax', label: 'Tax', icon: Tag },
  { value: 'delivery', label: 'Delivery', icon: Truck },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'appearance', label: 'Appearance', icon: Palette },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialSettings, setInitialSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => { if (j.success) setInitialSettings(j.data ?? {}) })
      .catch(() => {})
  }, [])

  const handleSave = async (settings: any) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error || 'Failed to save settings')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl text-primary">Settings</h1>
            <p className="text-[color-mix(in_srgb,var(--ink)_60%,transparent)]">Configure your store settings</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex items-center gap-2 px-4 py-2 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] border-2 border-[var(--success)] rounded-pill text-[var(--success)] text-sm font-medium animate-fade-in"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Settings saved!</span>
              </motion.div>
            )}
            <Button
              onClick={() => {}}
              variant="doodle"
              size="lg"
              disabled={saving}
              className="group"
            >
              <Save className="w-5 h-5 mr-2 transition-transform group-hover:translate-x-1" />
              <span>Save Changes</span>
              {saving && <Loader2 className="w-5 h-5 animate-spin ml-2" />}
              <StickerPeel />
            </Button>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 15 }}
        >
          <Tabs defaultValue={activeTab} onChange={setActiveTab} variant="pills">
            <TabsList className="flex flex-wrap gap-2 bg-[var(--light)] rounded-card p-1">
              {tabs.map((tab, index) => (
                <motion.div
                  key={tab.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 100, damping: 15 }}
                >
                  <TabsTrigger value={tab.value} className="gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                </motion.div>
              ))}
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6 animate-fade-in">
              <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
            </TabsContent>

            {/* Tax Settings */}
            <TabsContent value="tax" className="animate-fade-in">
              <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
            </TabsContent>

            {/* Delivery Settings */}
            <TabsContent value="delivery" className="animate-fade-in">
              <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="animate-fade-in">
              <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="animate-fade-in">
              <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Decorative elements */}
        <DoodleShape size="xl" color="primary" animation="float" className="absolute bottom-10 right-10 opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
        <DoodleShape size="lg" color="accent" animation="wobble" className="absolute bottom-20 left-10 opacity-5 pointer-events-none" style={{ zIndex: -1 }} />
      </div>
    </div>
  )
}