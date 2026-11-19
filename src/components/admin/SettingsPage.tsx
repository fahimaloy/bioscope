'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SettingsForm } from '@/components/admin/SettingsForm'
import type { SettingsTab } from '@/lib/admin-settings'

export interface SettingsData {
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
  smtp_secure?: boolean
  from_email?: string
  from_name?: string
  order_confirmation_template?: string
}

/**
 * Loads settings, owns the save round-trip, and renders the tabbed form.
 *
 * Secret settings (SMTP password, payment-gateway credentials) are returned
 * masked by the server. The form echoes a mask back unchanged, which
 * `updateSettings()` recognises and preserves; typing a new value replaces it
 * and an emptied field clears it.
 */
export function SettingsPage({ initialTab }: { initialTab?: SettingsTab }) {
  const [initialSettings, setInitialSettings] = useState<SettingsData | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => setInitialSettings(j?.success ? (j.data ?? {}) : {}))
      .catch(() => setInitialSettings({}))
  }, [])

  const handleSave = async (settings: SettingsData) => {
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
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {initialSettings === null ? (
          <p className="text-[var(--text-muted)]">Loading settings…</p>
        ) : (
          <SettingsForm onSave={handleSave} initialSettings={initialSettings} initialTab={initialTab} />
        )}
      </div>
    </div>
  )
}
