'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Plus, Copy, Ban, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { API_KEY_SCOPES } from '@/lib/validations/api-key'

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

interface CreatedKey extends ApiKey {
  plaintext: string
}

function statusOf(key: ApiKey): { label: string; variant: 'success' | 'error' | 'default' } {
  if (key.revokedAt) return { label: 'Revoked', variant: 'error' }
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) {
    return { label: 'Expired', variant: 'default' }
  }
  return { label: 'Active', variant: 'success' }
}

/**
 * Headless API keys for the Settings → API Keys tab. The plaintext key is shown
 * exactly once, right after creation — the server only stores its hash.
 */
export function ApiKeySettings() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['orders:read'])
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<CreatedKey | null>(null)
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  const [deleting, setDeleting] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/api-keys')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load API keys')
      setKeys(json.data ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes, expiresAt: expiry || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to create key')
      setCreated(json.data)
      setFormOpen(false)
      setName('')
      setScopes(['orders:read'])
      setExpiry('')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create key')
    } finally {
      setSaving(false)
    }
  }

  const copyPlaintext = async (plaintext: string) => {
    try {
      await navigator.clipboard.writeText(plaintext)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the key and copy it manually')
    }
  }

  const handleRevoke = async () => {
    if (!revoking) return
    try {
      const res = await fetch(`/api/api-keys/${revoking.id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Revoke failed')
      toast.success('Key revoked')
      setRevoking(null)
      await load()
    } catch {
      toast.error('Revoke failed')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/api-keys/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Key deleted')
      setDeleting(null)
      await load()
    } catch {
      toast.error('Delete failed')
    }
  }

  if (loading) {
    return <p className="text-[var(--text-muted)]">Loading API keys…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--text-subtle)]">
          Headless keys for integrations. Send <code>Authorization: Bearer &lt;key&gt;</code>. A key works until it
          is revoked or expires.
        </p>
        <Button variant="doodle" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Generate key
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card variant="doodle" padding="lg" className="text-center text-[var(--text-subtle)]">
          No API keys yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => {
            const status = statusOf(key)
            return (
              <Card key={key.id} variant="doodle" padding="md" className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-medium text-[var(--ink)]">
                      <KeyRound className="w-4 h-4" />
                      {key.name}
                    </p>
                    <p className="text-sm text-[var(--text-subtle)] mt-1 font-mono">{key.prefix}…</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="outline" size="xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} size="sm">
                      {status.label}
                    </Badge>
                    {!key.revokedAt && (
                      <Button variant="outline" size="sm" onClick={() => setRevoking(key)}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setDeleting(key)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-subtle)] border-t border-[var(--paper-deep)] pt-2">
                  Created {new Date(key.createdAt).toLocaleString()}
                  {key.lastUsedAt ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}` : ' · never used'}
                  {key.expiresAt ? ` · expires ${new Date(key.expiresAt).toLocaleString()}` : ''}
                </p>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Generate API key"
        description="The key is shown once. Store it somewhere safe — it cannot be retrieved again."
        size="lg"
      >
        <div className="space-y-5">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nightly stock sync" />
          <div>
            <p className="text-sm font-medium text-[var(--ink)] mb-2">Scopes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {API_KEY_SCOPES.map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                  <Checkbox checked={scopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} aria-label={scope} />
                  {scope}
                </label>
              ))}
            </div>
          </div>
          <Input label="Expires at (optional)" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          {scopes.length === 0 && <p className="text-sm text-[var(--warning)]">Select at least one scope.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="doodle" onClick={handleCreate} loading={saving} disabled={scopes.length === 0 || name.trim().length < 2}>
              Generate
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={created !== null}
        onClose={() => setCreated(null)}
        title="API key created"
        size="md"
      >
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-[var(--warning)]">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Copy this now. It will not be shown again and the server stores only its hash.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-input border-2 border-[var(--light)] bg-[var(--paper-deep)] p-3 text-sm">
              {created?.plaintext}
            </code>
            <Button variant="outline" size="sm" onClick={() => created && copyPlaintext(created.plaintext)}>
              <Copy className="w-4 h-4 mr-1" /> {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button variant="doodle" onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={revoking !== null}
        onClose={() => setRevoking(null)}
        onConfirm={handleRevoke}
        title="Revoke API key"
        message={`Revoke "${revoking?.name ?? ''}"? It stops working immediately. The record is kept for audit.`}
        confirmText="Revoke"
      />

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete API key"
        message={`Delete "${deleting?.name ?? ''}" permanently? This cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}
