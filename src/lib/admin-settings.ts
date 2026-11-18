/**
 * Settings tabs, shared by the `/admin/settings` routes (server) and the
 * `SettingsForm` (client) so a URL can deep-link to a tab and the two can
 * never drift apart.
 */

export const SETTINGS_TABS = [
  'general',
  'tax',
  'delivery',
  'payments',
  'email',
  'appearance',
  'webhooks',
  'api-keys',
] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]

const TAB_SET: ReadonlySet<string> = new Set(SETTINGS_TABS)

export function isSettingsTab(value: string): value is SettingsTab {
  return TAB_SET.has(value)
}

export const SETTINGS_TAB_LABELS: Record<SettingsTab, string> = {
  general: 'General',
  tax: 'Tax',
  delivery: 'Delivery',
  payments: 'Payments',
  email: 'Email',
  appearance: 'Appearance',
  webhooks: 'Webhooks',
  'api-keys': 'API Keys',
}
