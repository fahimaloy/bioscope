import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { webhookEndpointSchema, WEBHOOK_EVENTS } from '@/lib/validations/webhook'
import { signWebhookPayload } from '@/lib/server/webhooks'

describe('webhookEndpointSchema', () => {
  const valid = {
    url: 'https://example.com/hooks/bioscope',
    events: ['order.created'],
    isActive: true,
  }

  it('accepts a minimal valid endpoint', () => {
    expect(webhookEndpointSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a secret and a description', () => {
    expect(webhookEndpointSchema.safeParse({ ...valid, secret: 's3cret', description: 'Ops channel' }).success).toBe(true)
  })

  it('rejects a non-URL endpoint', () => {
    expect(webhookEndpointSchema.safeParse({ ...valid, url: 'not-a-url' }).success).toBe(false)
  })

  it('rejects an endpoint with no events', () => {
    expect(webhookEndpointSchema.safeParse({ ...valid, events: [] }).success).toBe(false)
  })

  it('rejects an unknown event', () => {
    expect(webhookEndpointSchema.safeParse({ ...valid, events: ['order.teleported'] }).success).toBe(false)
  })

  it('rejects a secret that is too long', () => {
    expect(webhookEndpointSchema.safeParse({ ...valid, secret: 'x'.repeat(201) }).success).toBe(false)
  })

  it('covers the events the dispatch path emits', () => {
    for (const event of [
      'order.created',
      'order.status_changed',
      'payment.received',
      'custom_request.submitted',
      'custom_request.priced',
      'custom_request.updated',
    ]) {
      expect(WEBHOOK_EVENTS).toContain(event)
    }
  })
})

describe('signWebhookPayload', () => {
  it('produces the expected HMAC-SHA256 header', () => {
    const body = JSON.stringify({ event: 'order.created', data: { id: 'o1' } })
    const expected = `sha256=${createHmac('sha256', 's3cret').update(body).digest('hex')}`
    expect(signWebhookPayload('s3cret', body)).toBe(expected)
  })

  it('changes when the body changes', () => {
    expect(signWebhookPayload('s3cret', '{"a":1}')).not.toBe(signWebhookPayload('s3cret', '{"a":2}'))
  })

  it('changes when the secret changes', () => {
    expect(signWebhookPayload('s3cret', '{"a":1}')).not.toBe(signWebhookPayload('other', '{"a":1}'))
  })
})
