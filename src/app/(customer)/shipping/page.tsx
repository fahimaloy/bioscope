'use client'

import { useEffect, useState } from 'react'
import { ContentPage } from '@/components/content/ContentPage'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

interface PublicSettings {
  delivery_enabled?: boolean
  delivery_inside_dhaka_charge?: number
  free_delivery_threshold?: number
}

// Ruling 3: state the operational facts we CAN truthfully show — live delivery
// charge / free-delivery threshold from the public settings API. The rest of
// the policy is an honest placeholder (no invented legal text).
function DeliveryFacts() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/settings/public')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
      .then((json) => { if (active) setSettings(json?.data ?? {}) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [])

  if (failed) {
    return (
      <Card variant="doodle" padding="lg">
        <p className="text-[var(--text-muted)]">
          Live delivery rates are unavailable right now. Please contact us for current charges.
        </p>
      </Card>
    )
  }
  if (!settings) {
    return <Card variant="doodle" padding="lg"><p className="text-[var(--text-subtle)]">Loading delivery rates…</p></Card>
  }

  const charge = Number(settings.delivery_inside_dhaka_charge ?? 0)
  const threshold = Number(settings.free_delivery_threshold ?? 0)
  return (
    <Card variant="doodle" padding="lg">
      <h2 className="mb-4 font-display text-2xl text-[var(--text)]">Current delivery rates</h2>
      <ul className="space-y-2 text-[var(--text-muted)]">
        <li>Inside Dhaka: <strong className="text-[var(--text)]">{formatCurrency(charge)}</strong></li>
        {threshold > 0 && (
          <li>Free delivery on orders over <strong className="text-[var(--text)]">{formatCurrency(threshold)}</strong></li>
        )}
        <li>Delivery currently {settings.delivery_enabled ? 'available' : 'unavailable'}.</li>
      </ul>
      <p className="mt-4 text-sm text-[var(--text-subtle)]">Rates are read live from our settings and may change.</p>
    </Card>
  )
}

export default function ShippingPage() {
  return (
    <ContentPage
      title="Shipping"
      eyebrow="Support"
      sections={[
        {
          heading: 'Delivery times',
          body: [
            'Inside Dhaka: 2-3 business days. Outside Dhaka: 3-5 business days. Custom orders may take additional time for production.',
            // TODO: owner copy — approved shipping policy, carriers, international options.
            'Our full shipping policy is being finalized. For specific delivery questions, contact us and we\'ll confirm before you order.',
          ],
        },
      ]}
    >
      <DeliveryFacts />
    </ContentPage>
  )
}
