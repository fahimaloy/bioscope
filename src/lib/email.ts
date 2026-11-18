// Server-only SMTP mailer. Configured via SMTP_* environment variables.
import nodemailer from 'nodemailer'
import { AppError } from '@/lib/api-utils'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST)
}

interface SendMailInput {
  to: string
  subject: string
  html: string
}

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const host = process.env.SMTP_HOST
  if (!host) {
    throw new AppError(
      501,
      'Email is not configured on this server. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM_EMAIL in the environment.',
      'EMAIL_NOT_CONFIGURED'
    )
  }
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass: process.env.SMTP_PASSWORD } : undefined,
  })
  const from = process.env.SMTP_FROM_EMAIL || user || 'no-reply@bioscope.com'
  await transporter.sendMail({ from, to, subject, html })
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
