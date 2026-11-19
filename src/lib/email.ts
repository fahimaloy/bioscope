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

/** Branded password-reset email (E1). The token is hex, the URL is built
 * server-side — nothing user-supplied lands in this template unescaped. */
export function passwordResetEmailHtml(resetUrl: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
  <h1 style="font-size:22px;margin:0 0 16px">BIOSCOPE</h1>
  <p>We received a request to reset your password. Click the button below to choose a new one:</p>
  <p style="margin:24px 0">
    <a href="${resetUrl}" style="display:inline-block;background:#C2185B;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold">Reset password</a>
  </p>
  <p style="font-size:14px;color:#555">This link expires in 1 hour. If the button doesn't work, copy this address into your browser:<br>
  <span style="word-break:break-all">${resetUrl}</span></p>
  <p style="font-size:14px;color:#555">If you didn't request a reset, you can safely ignore this email — your password stays unchanged.</p>
</div>`
}
