/**
 * E1 — password-reset flow completion.
 *
 * Route-handler coverage (real handlers, mocked auth/prisma/email):
 *   - forgot-password DELIVERS the reset email when SMTP is configured
 *     (the old production path created a token and sent nothing)
 *   - delivery failure / unconfigured SMTP never change the generic response
 *   - devToken is a non-production convenience only
 *   - unknown email → identical response, no token, no email (no enumeration)
 *   - reset-password: valid token updates the hash + consumes the token;
 *     missing/used/expired → 400 INVALID_TOKEN
 *   - login (nextauth credentials callback) is rate-limited: 10/min/IP,
 *     signout and GET pass through untouched (B3 leftover)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(async () => null),
  sendMail: vi.fn(async (_input: { to: string; subject: string; html: string }) => undefined),
  isEmailConfigured: vi.fn(async () => true),
  handlersPOST: vi.fn(async () => new Response(null, { status: 200 })),
  user: {
    findUnique: vi.fn(),
    update: vi.fn(async (_args: { where: { id: string }; data: { passwordHash: string } }) => ({})),
  },
  passwordResetToken: {
    create: vi.fn(async (_args: { data: { tokenHash: string } }) => ({})),
    findUnique: vi.fn(),
    update: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
  handlers: { GET: vi.fn(), POST: mocks.handlersPOST },
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: mocks.user,
    passwordResetToken: mocks.passwordResetToken,
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}))
vi.mock('@/lib/email', () => ({
  sendMail: mocks.sendMail,
  passwordResetEmailHtml: (url: string) => `<a href="${url}">reset</a>`,
}))
vi.mock('@/lib/server/email-config', () => ({
  isEmailConfigured: mocks.isEmailConfigured,
}))

import { POST as forgotPOST } from '@/app/api/auth/forgot-password/route'
import { POST as resetPOST } from '@/app/api/auth/reset-password/route'
import { POST as authPOST, GET as authGET } from '@/app/api/auth/[...nextauth]/route'
import { NextRequest } from 'next/server'
import crypto from 'node:crypto'

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

let ipCounter = 0
const nextIp = () => `10.9.${++ipCounter}.1`

const post = (handler: (r: Request) => Promise<Response>, body: unknown, ip = nextIp()) =>
  handler(
    new Request('http://localhost/api/auth/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    })
  )

beforeEach(() => {
  vi.clearAllMocks()
  mocks.isEmailConfigured.mockResolvedValue(true)
  mocks.user.findUnique.mockResolvedValue({ id: 'u-1' })
  mocks.passwordResetToken.create.mockResolvedValue({})
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/auth/forgot-password — email delivery (E1)', () => {
  it('sends the reset email with a working reset link when SMTP is configured', async () => {
    const res = await post(forgotPOST, { email: 'user@example.com' })
    expect(res.status).toBe(200)
    expect(mocks.sendMail).toHaveBeenCalledTimes(1)
    const mail = mocks.sendMail.mock.calls[0][0]
    expect(mail.to).toBe('user@example.com')
    expect(mail.subject).toContain('Reset your password')
    // The link carries the SAME token whose hash was stored
    const created = mocks.passwordResetToken.create.mock.calls[0][0]
    const url = mail.html.match(/href="([^"]+)"/)?.[1] ?? ''
    expect(url).toContain('/reset-password?token=')
    const token = new URL(url).searchParams.get('token') ?? ''
    expect(hashToken(token)).toBe(created.data.tokenHash)
  })

  it('does not send when SMTP is unconfigured, still returns the generic message', async () => {
    mocks.isEmailConfigured.mockResolvedValue(false)
    const json = await (await post(forgotPOST, { email: 'user@example.com' })).json()
    expect(mocks.sendMail).not.toHaveBeenCalled()
    expect(json.success).toBe(true)
    expect(json.data.message).toContain('If that email exists')
  })

  it('keeps the generic response when delivery fails (no enumeration, no 500)', async () => {
    mocks.sendMail.mockRejectedValueOnce(new Error('SMTP down'))
    const res = await post(forgotPOST, { email: 'user@example.com' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.message).toContain('If that email exists')
  })

  it('returns devToken outside production only', async () => {
    // vitest runs with NODE_ENV=test
    const dev = await (await post(forgotPOST, { email: 'user@example.com' })).json()
    expect(typeof dev.data.devToken).toBe('string')

    vi.stubEnv('NODE_ENV', 'production')
    const prod = await (await post(forgotPOST, { email: 'user@example.com' })).json()
    expect(prod.data.devToken).toBeUndefined()
  })

  it('unknown email: identical message, no token created, no email sent', async () => {
    mocks.user.findUnique.mockResolvedValue(null)
    const json = await (await post(forgotPOST, { email: 'nobody@example.com' })).json()
    expect(json.success).toBe(true)
    expect(json.data.message).toContain('If that email exists')
    expect(json.data.devToken).toBeUndefined()
    expect(mocks.passwordResetToken.create).not.toHaveBeenCalled()
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/reset-password — token consumption (E1)', () => {
  const validRecord = {
    id: 'tok-1',
    userId: 'u-1',
    tokenHash: hashToken('valid-token'),
    usedAt: null,
    expiresAt: new Date(Date.now() + 3_600_000),
  }

  it('valid token: hashes the new password, marks used, clears sibling tokens', async () => {
    mocks.passwordResetToken.findUnique.mockResolvedValue(validRecord)
    const res = await post(resetPOST, { token: 'valid-token', password: 'NewPass123' })
    expect(res.status).toBe(200)
    const update = mocks.user.update.mock.calls[0][0]
    expect(update.where.id).toBe('u-1')
    expect(update.data.passwordHash).not.toBe('NewPass123')
    expect(update.data.passwordHash.startsWith('$2')).toBe(true) // bcrypt hash
    expect(mocks.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tok-1' }, data: { usedAt: expect.any(Date) } })
    )
    expect(mocks.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u-1' } })
  })

  it.each([
    ['missing', null],
    ['used', { ...validRecord, usedAt: new Date() }],
    ['expired', { ...validRecord, expiresAt: new Date(Date.now() - 1000) }],
  ])('%s token → 400 INVALID_TOKEN, no password change', async (_label, record) => {
    mocks.passwordResetToken.findUnique.mockResolvedValue(record)
    const res = await post(resetPOST, { token: 'valid-token', password: 'NewPass123' })
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_TOKEN')
    expect(mocks.user.update).not.toHaveBeenCalled()
  })
})

describe('nextauth POST wrapper — login rate limit (B3 leftover)', () => {
  const authReq = (path: string, ip: string) =>
    new NextRequest(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: 'csrfToken=x&email=a%40b.c&password=whatever',
    })

  it('allows 10 credential sign-ins per minute per IP, blocks the 11th with Retry-After', async () => {
    const ip = nextIp()
    for (let i = 0; i < 10; i++) {
      const res = await authPOST(authReq('/api/auth/callback/credentials', ip))
      expect(res.status).toBe(200)
    }
    const blocked = await authPOST(authReq('/api/auth/callback/credentials', ip))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
    expect(mocks.handlersPOST).toHaveBeenCalledTimes(10) // blocked request never reaches auth
  })

  it('does not throttle signout or GET', async () => {
    const ip = nextIp()
    for (let i = 0; i < 12; i++) {
      const res = await authPOST(authReq('/api/auth/signout', ip))
      expect(res.status).toBe(200)
    }
    expect(typeof authGET).toBe('function')
  })
})