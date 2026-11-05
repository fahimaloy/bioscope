'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Settings, Tag, Truck, Mail, Palette, Globe, Bell, Shield, Users, DollarSign, CheckCircle } from 'lucide-react'

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
  const [initialSettings, setInitialSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => { if (j.success) setInitialSettings(j.data ?? {}) })
      .catch(() => {})
  }, [])

  const handleSave = async (settings: any) => {
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
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl text-primary">Settings</h1>
            <p className="text-[var(--ink)]/60">Configure your store settings</p>
          </div>
          <div className="flex gap-3">
            {saved && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-input text-green-700 text-sm animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                Saved!
              </div>
            )}
            <Button onClick={() => {}} variant="primary">
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-[var(--light)] rounded-input p-1 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general">
            <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
          </TabsContent>

          <TabsContent value="tax">
            <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
          </TabsContent>

          <TabsContent value="delivery">
            <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
          </TabsContent>

          <TabsContent value="email">
            <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
          </TabsContent>

          <TabsContent value="appearance">
            <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}