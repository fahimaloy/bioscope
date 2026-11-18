// Server-only headless API keys.
//
// The plaintext key is generated once and shown once; only its SHA-256 hash is
// stored, so a database dump cannot be used to call the headless API. Keys are
// scoped, can expire, and can be revoked without touching the routes they
// protect.

import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/api-utils'
import { apiKeyCreateSchema, hasAllScopes, type ApiKeyScope } from '@/lib/validations/api-key'

const KEY_PREFIX = 'bsk_live_'
const PREFIX_DISPLAY_LENGTH = 16

/** SHA-256 of a key. Only the hash is stored; the plaintext is shown once. */
export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

export interface ApiKeyView {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt: Date | null
  expiresAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

function toView(key: {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt: Date | null
  expiresAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}): ApiKeyView {
  return { ...key }
}

/**
 * Create a key. Returns the view plus the plaintext — the only time the
 * plaintext is ever available.
 */
export async function createApiKey(data: unknown, adminId: string) {
  const validated = apiKeyCreateSchema.parse(data)
  const plaintext = `${KEY_PREFIX}${randomBytes(32).toString('hex')}`

  const stored = await prisma.apiKey.create({
    data: {
      name: validated.name,
      prefix: plaintext.slice(0, PREFIX_DISPLAY_LENGTH),
      keyHash: hashApiKey(plaintext),
      scopes: validated.scopes,
      expiresAt: validated.expiresAt,
      createdBy: adminId,
    },
  })

  return { key: toView(stored), plaintext }
}

export async function listApiKeys(): Promise<ApiKeyView[]> {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  })
  return keys.map(toView)
}

export async function revokeApiKey(id: string) {
  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })
}

export async function deleteApiKey(id: string) {
  await prisma.apiKey.delete({ where: { id } })
}

export interface VerifiedKey {
  id: string
  name: string
  scopes: ApiKeyScope[]
}

function isScopedKey(scopes: string[]): scopes is ApiKeyScope[] {
  return scopes.every((scope) => scope.includes(':'))
}

/**
 * Resolve the key in an `Authorization: Bearer <key>` header.
 * Returns null when the header is missing, malformed, unknown, expired or
 * revoked. Updates `lastUsedAt` on success.
 */
export async function verifyApiKey(header: string | null): Promise<VerifiedKey | null> {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) return null

  const candidate = match[1].trim()
  if (!candidate.startsWith(KEY_PREFIX)) return null

  const stored = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(candidate) } })
  if (!stored) return null
  if (stored.revokedAt) return null
  if (stored.expiresAt && stored.expiresAt.getTime() < Date.now()) return null
  if (!isScopedKey(stored.scopes)) return null

  // Best-effort: a failure to record usage must not reject a valid request.
  prisma.apiKey
    .update({ where: { id: stored.id }, data: { lastUsedAt: new Date() } })
    .catch((error) => console.error('[api-keys] failed to record usage:', error))

  return { id: stored.id, name: stored.name, scopes: stored.scopes }
}

/** A key must hold EVERY requested scope, not merely one of them. */
export { hasAllScopes } from '@/lib/validations/api-key'

/** Throwing guard for route handlers that accept headless API-key callers. */
export async function requireApiKey(scopes: ApiKeyScope[], request: Request): Promise<VerifiedKey> {
  const key = await verifyApiKey(request.headers.get('authorization'))
  if (!key) throw new AppError(401, 'A valid API key is required', 'UNAUTHENTICATED')
  if (!hasAllScopes(key.scopes, scopes)) {
    throw new AppError(403, `This key does not have the ${scopes.join(', ')} scope`, 'FORBIDDEN')
  }
  return key
}
