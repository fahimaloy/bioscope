// Server-only SMTP mailer. Configuration comes from the database settings
// (admin panel) with SMTP_* environment variables as a fallback — see
// src/lib/server/email-config.ts.
import nodemailer from 'nodemailer'
import { AppError } from '@/lib/api-utils'
import { getSmtpConfig } from '@/lib/server/email-config'

interface SendMailInput {
  to: string
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const config = await getSmtpConfig()
  if (!config.host) {
    throw new AppError(
      501,
      'Email is not configured on this server. Set the SMTP host in Admin → Settings → Email or in the environment.',
      'EMAIL_NOT_CONFIGURED'
    )
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  })

  await transporter.sendMail({
    from: { name: config.fromName, address: config.from },
    to,
    subject,
    html,
  })
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
