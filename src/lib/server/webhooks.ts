// Server-only webhook delivery.
//
// Endpoints subscribe to events; dispatch fans out to every active endpoint,
// signs the body with the endpoint's HMAC secret, and records the outcome so an
// admin can see what was delivered and what failed.
//
// Dispatch never throws: a slow or broken subscriber must not break the order
// or custom-request mutation that triggered it.

import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret, isEncryptedPayload } from '@/lib/crypto'
import { WEBHOOK_EVENTS, webhookEndpointSchema, webhookEndpointUpdateSchema } from '@/lib/validations/webhook'

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

const DELIVERY_TIMEOUT_MS = 5000
const MAX_DELIVERY_ERROR_LENGTH = 500
/** Delivery log rows older than this are pruned (PII retention bound). */
export const DELIVERY_RETENTION_DAYS = 30
const PRUNE_INTERVAL_MS = 60 * 60 * 1000
let lastPruneAt = 0

// The delivery log is admin-readable and long-lived, so it must not retain
// customer PII. Subscribers still receive the full payload over HTTPS; only
// the stored log copy is redacted. These keys (and any *email*/*phone* key)
// are replaced with a placeholder at any depth.
const REDACTED_KEYS = new Set([
  'user',
  'address',
  'shippingname',
  'shippingphone',
  'shippingaddress',
  'shippingcity',
  'shippingdistrict',
  'shippingzip',
  'shippingcountry',
])
const REDACTED_KEY_PATTERN = /email|phone/i
const MAX_REDACT_DEPTH = 8

/** Redact PII from a payload copy destined for the delivery log. Pure. */
export function redactForDeliveryLog(value: unknown, depth = 0): unknown {
  if (depth > MAX_REDACT_DEPTH) return '[redacted]'
  if (Array.isArray(value)) return value.map((item) => redactForDeliveryLog(item, depth + 1))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const lower = key.toLowerCase()
      out[key] =
        REDACTED_KEYS.has(lower) || REDACTED_KEY_PATTERN.test(lower)
          ? '[redacted]'
          : redactForDeliveryLog(item, depth + 1)
    }
    return out
  }
  return value
}

/** Delete delivery log rows past the retention window. Returns rows removed. */
export async function pruneOldDeliveries(now = Date.now()): Promise<number> {
  const cutoff = new Date(now - DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const { count } = await prisma.webhookDelivery.deleteMany({
    where: { createdAt: { lt: cutoff } },
  })
  return count
}

/** Opportunistic prune, at most once an hour. Never throws. */
async function pruneDeliveriesThrottled(): Promise<void> {
  const now = Date.now()
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return
  lastPruneAt = now
  try {
    await pruneOldDeliveries(now)
  } catch (error) {
    console.error('[webhooks] delivery prune failed:', error)
  }
}

export interface WebhookEndpointView {
  id: string
  url: string
  description: string | null
  events: string[]
  isActive: boolean
  /** True when an HMAC secret is stored. The secret itself is never returned. */
  hasSecret: boolean
  createdAt: Date
  lastDeliveryAt: Date | null
  lastStatus: string | null
  deliveryCount: number
  failureCount: number
}

/** Create an endpoint. Returns the stored row minus the secret. */
export async function createWebhookEndpoint(data: unknown, adminId: string) {
  const validated = webhookEndpointSchema.parse(data)
  return prisma.webhookEndpoint.create({
    data: {
      url: validated.url,
      description: validated.description,
      events: validated.events,
      secret: validated.secret ? encryptSecret(validated.secret) : null,
      isActive: validated.isActive,
      createdBy: adminId,
    },
  })
}

export async function updateWebhookEndpoint(id: string, data: unknown) {
  const validated = webhookEndpointUpdateSchema.parse(data)
  // An empty secret means "leave the stored one alone"; a non-empty value is a
  // new secret and gets encrypted.
  const secret =
    validated.secret === undefined ? undefined : validated.secret ? encryptSecret(validated.secret) : null

  return prisma.webhookEndpoint.update({
    where: { id },
    data: {
      url: validated.url,
      description: validated.description,
      events: validated.events,
      isActive: validated.isActive,
      ...(secret !== undefined ? { secret } : {}),
    },
  })
}

export async function deleteWebhookEndpoint(id: string) {
  await prisma.webhookEndpoint.delete({ where: { id } })
}

/** List endpoints with a short delivery summary. Admin-only callers. */
export async function listWebhookEndpoints(): Promise<WebhookEndpointView[]> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { status: true, createdAt: true },
      },
    },
  })

  if (endpoints.length === 0) return []

  const stats = await prisma.webhookDelivery.groupBy({
    by: ['endpointId', 'status'],
    where: { endpointId: { in: endpoints.map((e) => e.id) } },
    _count: { _all: true },
  })
  const failures = new Map<string, number>()
  for (const row of stats) {
    if (row.status === 'failed') failures.set(row.endpointId, row._count._all)
  }

  return endpoints.map((endpoint) => {
    const last = endpoint.deliveries[0]
    return {
      id: endpoint.id,
      url: endpoint.url,
      description: endpoint.description,
      events: endpoint.events,
      isActive: endpoint.isActive,
      hasSecret: Boolean(endpoint.secret),
      createdAt: endpoint.createdAt,
      lastDeliveryAt: last?.createdAt ?? null,
      lastStatus: last?.status ?? null,
      deliveryCount: endpoint._count.deliveries,
      failureCount: failures.get(endpoint.id) ?? 0,
    }
  })
}

export async function listWebhookDeliveries(endpointId: string, limit = 50) {
  return prisma.webhookDelivery.findMany({
    where: { endpointId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(1, limit), 200),
  })
}

interface DeliveryResult {
  endpointId: string
  ok: boolean
  status: number | null
  error: string | null
  durationMs: number
}

/** HMAC-SHA256 signature header value for a webhook body. Exported for tests. */
export function signWebhookPayload(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

async function deliver(endpoint: {
  id: string
  url: string
  secret: string | null
}, event: WebhookEvent, payload: unknown): Promise<DeliveryResult> {
  const started = Date.now()
  const body = JSON.stringify({ event, data: payload, sentAt: new Date().toISOString() })
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': 'BIOSCOPE-webhook/1.0',
  }

  if (endpoint.secret) {
    headers['x-bioscope-event'] = event
  }

  try {
    // Signing can throw (key rotated/removed, tampered payload). It must not
    // escape into the caller's order/request mutation.
    if (endpoint.secret) {
      const signingSecret = isEncryptedPayload(endpoint.secret) ? decryptSecret(endpoint.secret) : endpoint.secret
      headers['x-bioscope-signature'] = signWebhookPayload(signingSecret, body)
    }
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      cache: 'no-store',
    })
    return {
      endpointId: endpoint.id,
      ok: res.ok,
      status: res.status,
      error: res.ok ? null : `HTTP ${res.status}`,
      durationMs: Date.now() - started,
    }
  } catch (error) {
    return {
      endpointId: endpoint.id,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message.slice(0, MAX_DELIVERY_ERROR_LENGTH) : 'Delivery failed',
      durationMs: Date.now() - started,
    }
  }
}

async function recordDelivery(result: DeliveryResult, event: WebhookEvent, payload: unknown) {
  try {
    // Normalise through JSON so Prisma Dates/Decimals become plain strings
    // and the column only ever holds valid JSON — then redact PII: the log
    // copy keeps operational fields, never customer contact details.
    const normalised = JSON.parse(JSON.stringify(payload ?? null)) as object
    await prisma.webhookDelivery.create({
      data: {
        endpointId: result.endpointId,
        event,
        status: result.ok ? 'delivered' : 'failed',
        responseCode: result.status,
        error: result.error,
        durationMs: result.durationMs,
        payload: redactForDeliveryLog(normalised) as object,
      },
    })
  } catch (error) {
    // Losing a delivery record must not break the caller either.
    console.error('[webhooks] failed to record delivery:', error)
  }
}

/**
 * Fan an event out to every active endpoint subscribed to it.
 * Returns the per-endpoint results; never throws.
 */
export async function dispatchWebhook(event: WebhookEvent, payload: unknown): Promise<DeliveryResult[]> {
  let endpoints: Array<{ id: string; url: string; secret: string | null }>
  try {
    endpoints = await prisma.webhookEndpoint.findMany({
      where: { isActive: true, events: { has: event } },
      select: { id: true, url: true, secret: true },
    })
  } catch (error) {
    // A DB hiccup must not fail the mutation that triggered this event.
    console.error('[webhooks] failed to load endpoints:', error)
    return []
  }

  if (endpoints.length === 0) return []

  const results = await Promise.all(endpoints.map((endpoint) => deliver(endpoint, event, payload)))
  await Promise.all(results.map((result) => recordDelivery(result, event, payload)))
  // Retention sweep rides along with dispatch (throttled, never throws).
  await pruneDeliveriesThrottled()
  return results
}

/** Send a test event to one endpoint and return the recorded delivery. */
export async function sendTestWebhook(endpointId: string, event: WebhookEvent) {
  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
    select: { id: true, url: true, secret: true },
  })
  if (!endpoint) throw new Error('Webhook endpoint not found')

  const payload = {
    test: true,
    message: 'This is a test event from the BIOSCOPE admin panel.',
  }
  const result = await deliver(endpoint, event, payload)
  await recordDelivery(result, event, payload)

  return {
    ok: result.ok,
    status: result.status,
    error: result.error,
    durationMs: result.durationMs,
  }
}
