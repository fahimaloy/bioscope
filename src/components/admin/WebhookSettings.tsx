'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Webhook, Plus, Pencil, Trash2, Send, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { WEBHOOK_EVENTS } from '@/lib/validations/webhook'

interface WebhookEndpoint {
  id: string
  url: string
  description: string | null
  events: string[]
  isActive: boolean
  hasSecret: boolean
  createdAt: string
  lastDeliveryAt: string | null
  lastStatus: string | null
  deliveryCount: number
  failureCount: number
}

interface Delivery {
  id: string
  event: string
  status: string
  responseCode: number | null
  error: string | null
  durationMs: number | null
  createdAt: string
}

const EMPTY_FORM = {
  url: '',
  description: '',
  events: [] as string[],
  secret: '',
  isActive: true,
}

/**
 * Webhook endpoints for the Settings → Webhooks tab. Self-contained: it owns
 * its own list/create/update/delete round-trips rather than riding the main
 * settings save, because an endpoint is a record, not a setting.
 */
export function WebhookSettings() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookEndpoint | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<WebhookEndpoint | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; status: number | null; error: string | null } | null>(null)
  const [openDeliveries, setOpenDeliveries] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [testEvent, setTestEvent] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/webhooks')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load webhooks')
      setEndpoints(json.data ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setTestResult(null)
    setFormOpen(true)
  }

  const openEdit = (endpoint: WebhookEndpoint) => {
    setEditing(endpoint)
    setForm({
      url: endpoint.url,
      description: endpoint.description ?? '',
      events: [...endpoint.events],
      // Never prefill the secret: the server only reports that one exists.
      secret: '',
      isActive: endpoint.isActive,
    })
    setTestResult(null)
    setFormOpen(true)
  }

  const toggleEvent = (event: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter((e) => e !== event) : [...prev.events, event],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        url: form.url,
        description: form.description || undefined,
        events: form.events,
        isActive: form.isActive,
        // An empty secret means "keep the stored one".
        secret: form.secret || undefined,
      }
      const res = await fetch(editing ? `/api/webhooks/${editing.id}` : '/api/webhooks', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || json?.details ? JSON.stringify(json.details) : 'Save failed')
      toast.success(editing ? 'Webhook updated' : 'Webhook created')
      setFormOpen(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/webhooks/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Delete failed')
      }
      toast.success('Webhook deleted')
      setDeleting(null)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const handleTest = async (id: string, event: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Test failed')
      setTestResult(json.data)
      toast.success(json.data.ok ? 'Delivered' : `Failed (${json.data.error ?? `HTTP ${json.data.status}`})`)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Test failed')
    } finally {
      setTestingId(null)
    }
  }

  const toggleDeliveries = async (id: string) => {
    if (openDeliveries === id) {
      setOpenDeliveries(null)
      return
    }
    setOpenDeliveries(id)
    setDeliveries([])
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`)
      const json = await res.json()
      if (res.ok) setDeliveries(json.data ?? [])
    } catch {
      toast.error('Failed to load deliveries')
    }
  }

  if (loading) {
    return <p className="text-[var(--text-muted)]">Loading webhooks…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-subtle)]">
          Endpoints subscribed to shop events. Bodies are signed with HMAC-SHA256 when a secret is set.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} aria-label="Refresh webhooks">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="doodle" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Add endpoint
          </Button>
        </div>
      </div>

      {endpoints.length === 0 ? (
        <Card variant="doodle" padding="lg" className="text-center text-[var(--text-subtle)]">
          No webhook endpoints yet.
        </Card>
      ) : (
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id} variant="doodle" padding="md" className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <a
                    href={endpoint.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-[var(--ink)] hover:text-[var(--primary)] break-all"
                  >
                    {endpoint.url}
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                  {endpoint.description && (
                    <p className="text-sm text-[var(--text-subtle)] mt-1">{endpoint.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {endpoint.events.map((event) => (
                      <Badge key={event} variant="outline" size="xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={endpoint.isActive ? 'success' : 'default'} size="sm">
                    {endpoint.isActive ? 'Active' : 'Paused'}
                  </Badge>
                  <Badge
                    variant={endpoint.lastStatus === 'failed' ? 'error' : endpoint.lastStatus ? 'success' : 'default'}
                    size="sm"
                  >
                    {endpoint.lastStatus ?? 'never sent'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openEdit(endpoint)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleting(endpoint)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--paper-deep)] pt-3">
                <select
                  value={testEvent[endpoint.id] ?? endpoint.events[0] ?? WEBHOOK_EVENTS[0]}
                  onChange={(e) => setTestEvent((prev) => ({ ...prev, [endpoint.id]: e.target.value }))}
                  aria-label="Test event"
                  className="px-3 py-2 border-2 border-[color-mix(in_srgb,var(--ink)_30%,transparent)] rounded-input bg-white text-body focus:border-primary focus:outline-none"
                >
                  {WEBHOOK_EVENTS.map((event) => (
                    <option key={event} value={event}>
                      {event}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  loading={testingId === endpoint.id}
                  onClick={() => handleTest(endpoint.id, testEvent[endpoint.id] ?? endpoint.events[0] ?? WEBHOOK_EVENTS[0])}
                >
                  <Send className="w-4 h-4 mr-1" /> Send test
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleDeliveries(endpoint.id)}>
                  <Webhook className="w-4 h-4 mr-1" />
                  {endpoint.deliveryCount} delivery{endpoint.deliveryCount === 1 ? '' : 's'}
                  {endpoint.failureCount > 0 ? ` · ${endpoint.failureCount} failed` : ''}
                </Button>
                {testResult && (
                  <span className={testResult.ok ? 'text-sm text-success' : 'text-sm text-[var(--error)]'}>
                    {testResult.ok ? `Delivered (HTTP ${testResult.status})` : testResult.error}
                  </span>
                )}
              </div>

              {openDeliveries === endpoint.id && (
                <div className="border-t border-[var(--paper-deep)] pt-3">
                  {deliveries.length === 0 ? (
                    <p className="text-sm text-[var(--text-subtle)]">No deliveries recorded.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[var(--text-subtle)]">
                          <th className="py-1 pr-3 font-medium">Event</th>
                          <th className="py-1 pr-3 font-medium">Status</th>
                          <th className="py-1 pr-3 font-medium">HTTP</th>
                          <th className="py-1 pr-3 font-medium">Duration</th>
                          <th className="py-1 font-medium">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((delivery) => (
                          <tr key={delivery.id} className="border-t border-[var(--paper-deep)]">
                            <td className="py-1.5 pr-3">{delivery.event}</td>
                            <td className="py-1.5 pr-3">
                              <Badge
                                variant={delivery.status === 'delivered' ? 'success' : 'error'}
                                size="xs"
                              >
                                {delivery.status}
                              </Badge>
                              {delivery.error && (
                                <span className="ml-2 text-[var(--text-subtle)]">{delivery.error}</span>
                              )}
                            </td>
                            <td className="py-1.5 pr-3">{delivery.responseCode ?? '—'}</td>
                            <td className="py-1.5 pr-3">{delivery.durationMs != null ? `${delivery.durationMs}ms` : '—'}</td>
                            <td className="py-1.5 text-[var(--text-subtle)]">
                              {new Date(delivery.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit webhook' : 'New webhook'}
        description="The URL must be reachable from the server. Leave the secret empty to keep the stored one."
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="Endpoint URL"
            value={form.url}
            onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/hooks/bioscope"
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
          <div>
            <p className="text-sm font-medium text-[var(--ink)] mb-2">Events</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                  <Checkbox
                    checked={form.events.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                    aria-label={event}
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <Input
            label={editing ? 'Signing secret (leave empty to keep)' : 'Signing secret (optional)'}
            type="password"
            value={form.secret}
            onChange={(e) => setForm((prev) => ({ ...prev, secret: e.target.value }))}
            placeholder="••••••••"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <Checkbox
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked === true }))}
              aria-label="Active"
            />
            Active
          </label>
          {form.events.length === 0 && (
            <p className="text-sm text-[var(--warning)]">Select at least one event.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="doodle" onClick={handleSave} loading={saving} disabled={form.events.length === 0}>
              {editing ? 'Save changes' : 'Create webhook'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete webhook"
        message={`Delete the endpoint ${deleting?.url ?? ''}? Its delivery history is removed too.`}
        confirmText="Delete"
      />
    </div>
  )
}
