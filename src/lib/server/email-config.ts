// Server-only SMTP configuration resolver.
//
// Settings stored in the database win over SMTP_* environment variables, so an
// admin can configure mail from the admin panel without a redeploy. The
// password is decrypted here — the only place that needs the plaintext — and
// is never returned to a client.

import { prisma } from '@/lib/prisma'
import { revealSecretSettings } from '@/lib/secret-settings'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user?: string
  password?: string
  from: string
  fromName: string
}

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_secure',
  'smtp_user',
  'smtp_password',
  'from_email',
  'from_name',
] as const

function toPort(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SMTP_KEYS] } },
    select: { key: true, value: true },
  })
  const stored = revealSecretSettings(Object.fromEntries(rows.map((row) => [row.key, row.value])))

  const host = String(stored.smtp_host ?? '') || process.env.SMTP_HOST || ''
  const port = toPort(
    stored.smtp_port ? String(stored.smtp_port) : undefined,
    toPort(process.env.SMTP_PORT, 587)
  )
  const user = String(stored.smtp_user ?? '') || process.env.SMTP_USER || undefined
  const password = String(stored.smtp_password ?? '') || process.env.SMTP_PASSWORD || undefined
  const secure =
    stored.smtp_secure === 'true' ? true : stored.smtp_secure === 'false' ? false : port === 465
  const from = String(stored.from_email ?? '') || process.env.SMTP_FROM_EMAIL || user || 'no-reply@bioscope.com'
  const fromName = String(stored.from_name ?? '') || process.env.SMTP_FROM_NAME || 'BIOSCOPE'

  return { host, port, secure, user, password, from, fromName }
}

export async function isEmailConfigured(): Promise<boolean> {
  return Boolean((await getSmtpConfig()).host)
}
