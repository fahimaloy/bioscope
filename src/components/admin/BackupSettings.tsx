'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'

interface ImportResult {
  applied: number
  skipped: Array<{ key: string; reason: string }>
}

/**
 * Settings backup and restore (Settings → Backup). Secrets are masked in a
 * default export; the encrypted form is available for a like-for-like restore.
 */
export function BackupSettings() {
  const [includeEncrypted, setIncludeEncrypted] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/settings/backup${includeEncrypted ? '?secrets=encrypted' : ''}`)
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Download failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'bioscope-settings.json'
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Backup downloaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleFile = async (file: File) => {
    setRestoring(true)
    setResult(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const res = await fetch('/api/settings/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Restore failed')
      setResult(json.data)
      toast.success(`Restored ${json.data.applied} setting${json.data.applied === 1 ? '' : 's'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Restore failed')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="doodle" padding="lg" className="space-y-4">
        <div>
          <h3 className="font-display text-lg text-[var(--ink)]">Download backup</h3>
          <p className="text-sm text-[var(--text-subtle)] mt-1">
            Exports every setting as JSON. Credentials are masked by default; choose the encrypted option to keep
            them restorable.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
          <Checkbox
            checked={includeEncrypted}
            onCheckedChange={(checked) => setIncludeEncrypted(checked === true)}
            aria-label="Include encrypted credentials"
          />
          Include encrypted credentials (no plaintext is ever exported)
        </label>
        <Button variant="doodle" onClick={handleDownload} loading={downloading}>
          <Download className="w-4 h-4 mr-2" /> Download backup
        </Button>
      </Card>

      <Card variant="doodle" padding="lg" className="space-y-4">
        <div>
          <h3 className="font-display text-lg text-[var(--ink)]">Restore backup</h3>
          <p className="text-sm text-[var(--text-subtle)] mt-1">
            Settings that are masked in the file are left unchanged, so a default export cannot wipe a stored
            credential.
          </p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Backup JSON file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setFileName(file.name)
              void handleFile(file)
            }
            e.target.value = ''
          }}
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => fileInput.current?.click()} loading={restoring}>
            <Upload className="w-4 h-4 mr-2" /> {restoring ? 'Restoring…' : 'Choose JSON file'}
          </Button>
          {fileName && (
            <span className="flex items-center gap-1.5 text-sm text-[var(--text-subtle)]">
              <FileJson className="w-4 h-4" /> {fileName}
            </span>
          )}
        </div>

        {result && (
          <div className="space-y-2 border-t border-[var(--paper-deep)] pt-3">
            <p className="text-sm text-[var(--ink)]">{result.applied} setting(s) applied.</p>
            {result.skipped.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-sm text-[var(--warning)]">
                  <AlertTriangle className="w-4 h-4" /> {result.skipped.length} skipped
                </p>
                <ul className="text-xs text-[var(--text-subtle)] space-y-0.5">
                  {result.skipped.map((entry) => (
                    <li key={entry.key}>
                      <code>{entry.key}</code> — {entry.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
