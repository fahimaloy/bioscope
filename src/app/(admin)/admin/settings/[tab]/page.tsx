import { notFound } from 'next/navigation'
import { SettingsPage } from '@/components/admin/SettingsPage'
import { isSettingsTab, SETTINGS_TAB_LABELS, type SettingsTab } from '@/lib/admin-settings'

export const dynamic = 'force-dynamic'

/**
 * Deep-linkable settings tabs (/admin/settings/tax, /payments, ...).
 * Only tabs the form actually renders are accepted; anything else is a 404
 * rather than a silently blank page.
 */
export default function SettingsTabRoute({ params }: { params: { tab: string } }) {
  if (!isSettingsTab(params.tab)) notFound()
  const tab = params.tab as SettingsTab
  return <SettingsPage key={tab} initialTab={tab} />
}

export function generateMetadata({ params }: { params: { tab: string } }) {
  if (!isSettingsTab(params.tab)) return {}
  return { title: `Admin · ${SETTINGS_TAB_LABELS[params.tab as SettingsTab]}` }
}
