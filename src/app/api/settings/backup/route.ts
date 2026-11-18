import { handleRouteError, ok, requireAdmin } from '@/lib/api-utils'
import { exportSettings, importSettings } from '@/lib/server/settings-backup'

export const dynamic = 'force-dynamic'

/**
 * Download a settings backup. Secrets are masked unless `?secrets=encrypted` is
 * passed, which returns the stored ciphertext so a restore preserves them.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const backup = await exportSettings({ includeEncryptedSecrets: url.searchParams.get('secrets') === 'encrypted' })
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="bioscope-settings.json"',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}

/** Restore a backup. Skipped entries come back with a reason. */
export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const result = await importSettings(body)
    return ok({ data: result })
  } catch (error) {
    return handleRouteError(error)
  }
}
