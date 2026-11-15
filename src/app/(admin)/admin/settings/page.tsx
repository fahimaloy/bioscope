'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default function SettingsPage() {
  const [initialSettings, setInitialSettings] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => setInitialSettings(j?.success ? (j.data ?? {}) : {}))
      .catch(() => setInitialSettings({}))
  }, [])

  const handleSave = async (settings: Record<string, any>) => {
    const res = await fetch('/api/settings/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => null)
      toast.error(j?.error || 'Failed to save settings')
      throw new Error(j?.error || 'Failed to save settings')
    }
    toast.success('Settings saved')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {initialSettings === null ? (
          <p className="text-[var(--text-muted)]">Loading settings…</p>
        ) : (
          <SettingsForm onSave={handleSave} initialSettings={initialSettings} />
        )}
      </div>
    </div>
  )
}
