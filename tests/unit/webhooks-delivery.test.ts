/**
 * Webhook delivery-log hygiene (2026-11-19 review follow-up).
 *
 * The stored delivery log must not retain customer PII, old rows must be
 * pruned, and none of it may ever throw into the triggering mutation.
 * Subscribers still receive the FULL payload — only the log copy is redacted.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  webhookEndpoint: { findMany: vi.fn() },
  webhookDelivery: { create: vi.fn(), deleteMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webhookEndpoint: mocks.webhookEndpoint,
    webhookDelivery: mocks.webhookDelivery,
  },
}))

// Fresh module per test: the prune throttle is module-level state.
async function loadWebhooks() {
  vi.resetModules()
  return import('@/lib/server/webhooks')
}

const ORDER_PAYLOAD = {
  id: 'o1',
  orderNumber: 'ORD-20261119-0001',
  status: 'PENDING',
  total: '1131.00',
  shippingName: 'Ada Lovelace',
  shippingPhone: '+8801700000000',
  shippingCity: 'Dhaka',
  user: { id: 'u1', email: 'ada@example.com', phone: '+8801700000000' },
  address: { addressLine1: '12 Analytical Way', city: 'Dhaka' },
  items: [{ productName: 'Kraft Stickers', quantity: 2, unitPrice: '80.00' }],
}

const ENDPOINT = { id: 'e1', url: 'https://subscriber.example.com/hook', secret: null }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.webhookEndpoint.findMany.mockResolvedValue([ENDPOINT])
  mocks.webhookDelivery.create.mockResolvedValue({ id: 'd1' })
  mocks.webhookDelivery.deleteMany.mockResolvedValue({ count: 0 })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('ok', { status: 200 }))
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('redactForDeliveryLog', () => {
  it('strips contact and address fields at any depth, keeps operational fields', async () => {
    const { redactForDeliveryLog } = await loadWebhooks()
    const redacted = redactForDeliveryLog(ORDER_PAYLOAD) as Record<string, unknown>
    expect(redacted.orderNumber).toBe('ORD-20261119-0001')
    expect(redacted.status).toBe('PENDING')
    expect(redacted.total).toBe('1131.00')
    expect(redacted.shippingName).toBe('[redacted]')
    expect(redacted.shippingPhone).toBe('[redacted]')
    expect(redacted.shippingCity).toBe('[redacted]')
    expect(redacted.user).toBe('[redacted]')
    expect(redacted.address).toBe('[redacted]')
    expect((redacted.items as Array<Record<string, unknown>>)[0].productName).toBe('Kraft Stickers')
  })

  it('redacts any email/phone-named key even in nested objects and arrays', async () => {
    const { redactForDeliveryLog } = await loadWebhooks()
    const redacted = redactForDeliveryLog({
      contactEmail: 'a@b.c',
      nested: { customerPhone: '123', safe: 'kept' },
      list: [{ email: 'x@y.z' }, { note: 'kept' }],
    }) as Record<string, any>
    expect(redacted.contactEmail).toBe('[redacted]')
    expect(redacted.nested.customerPhone).toBe('[redacted]')
    expect(redacted.nested.safe).toBe('kept')
    expect(redacted.list[0].email).toBe('[redacted]')
    expect(redacted.list[1].note).toBe('kept')
  })

  it('passes primitives through and bounds recursion depth', async () => {
    const { redactForDeliveryLog } = await loadWebhooks()
    expect(redactForDeliveryLog(null)).toBeNull()
    expect(redactForDeliveryLog('text')).toBe('text')
    expect(redactForDeliveryLog(42)).toBe(42)
    let deep: any = { leaf: 'value' }
    for (let i = 0; i < 12; i += 1) deep = { next: deep }
    expect(JSON.stringify(redactForDeliveryLog(deep))).toContain('[redacted]')
  })
})

describe('pruneOldDeliveries', () => {
  it('deletes only rows older than the retention window', async () => {
    const { pruneOldDeliveries, DELIVERY_RETENTION_DAYS } = await loadWebhooks()
    const now = Date.UTC(2026, 10, 19, 12, 0, 0)
    mocks.webhookDelivery.deleteMany.mockResolvedValue({ count: 7 })
    const removed = await pruneOldDeliveries(now)
    expect(removed).toBe(7)
    const expectedCutoff = new Date(now - DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    expect(mocks.webhookDelivery.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expectedCutoff } },
    })
  })
})

describe('dispatchWebhook delivery-log hygiene', () => {
  it('sends the full payload to the subscriber but stores a redacted copy', async () => {
    const { dispatchWebhook } = await loadWebhooks()
    const results = await dispatchWebhook('order.created', ORDER_PAYLOAD)
    expect(results).toHaveLength(1)
    expect(results[0].ok).toBe(true)

    // Wire copy: full payload (subscriber contract unchanged).
    const fetchMock = fetch as ReturnType<typeof vi.fn>
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(sent.data.user.email).toBe('ada@example.com')
    expect(sent.data.shippingPhone).toBe('+8801700000000')

    // Log copy: PII redacted, operational fields kept.
    const stored = mocks.webhookDelivery.create.mock.calls[0][0].data
    expect(stored.payload.user).toBe('[redacted]')
    expect(stored.payload.shippingName).toBe('[redacted]')
    expect(stored.payload.address).toBe('[redacted]')
    expect(stored.payload.orderNumber).toBe('ORD-20261119-0001')
    expect(stored.payload.items[0].productName).toBe('Kraft Stickers')
  })

  it('never throws when recording or pruning fails', async () => {
    const { dispatchWebhook } = await loadWebhooks()
    mocks.webhookDelivery.create.mockRejectedValue(new Error('db down'))
    mocks.webhookDelivery.deleteMany.mockRejectedValue(new Error('db down'))
    const results = await dispatchWebhook('order.created', ORDER_PAYLOAD)
    expect(results).toHaveLength(1)
    expect(results[0].ok).toBe(true)
  })

  it('never throws when the endpoint query fails', async () => {
    const { dispatchWebhook } = await loadWebhooks()
    mocks.webhookEndpoint.findMany.mockRejectedValue(new Error('db down'))
    await expect(dispatchWebhook('order.created', ORDER_PAYLOAD)).resolves.toEqual([])
  })

  it('throttles the prune to once per interval', async () => {
    const { dispatchWebhook } = await loadWebhooks()
    const t0 = Date.UTC(2026, 10, 19, 12, 0, 0)
    const nowSpy = vi.spyOn(Date, 'now')

    nowSpy.mockReturnValue(t0)
    await dispatchWebhook('order.created', ORDER_PAYLOAD)
    expect(mocks.webhookDelivery.deleteMany).toHaveBeenCalledTimes(1)

    nowSpy.mockReturnValue(t0 + 60_000)
    await dispatchWebhook('order.created', ORDER_PAYLOAD)
    expect(mocks.webhookDelivery.deleteMany).toHaveBeenCalledTimes(1)

    nowSpy.mockReturnValue(t0 + 2 * 60 * 60 * 1000)
    await dispatchWebhook('order.created', ORDER_PAYLOAD)
    expect(mocks.webhookDelivery.deleteMany).toHaveBeenCalledTimes(2)
  })
})
