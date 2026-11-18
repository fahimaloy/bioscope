import { handleRouteError, ok, created, requireAdmin } from '@/lib/api-utils'
import { createApiKey, listApiKeys } from '@/lib/server/api-keys'

export const dynamic = 'force-dynamic'

// Admin-only API key management
export async function GET() {
  try {
    await requireAdmin()
    return ok({ data: await listApiKeys() })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const { key, plaintext } = await createApiKey(body, admin.id)
    // `plaintext` is returned exactly once — the server keeps only its hash.
    return created({ data: { ...key, plaintext } })
  } catch (error) {
    return handleRouteError(error)
  }
}
