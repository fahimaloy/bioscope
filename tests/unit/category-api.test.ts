/**
 * Route-handler coverage for the admin-guarded /api/categories endpoints
 * (task 5.1.3). Route handlers run against mocked auth + Prisma so the
 * authorization and guard clauses are exercised in isolation:
 *   - POST: requireAdmin is enforced; a valid body produces a 201 with the
 *     icon/image fields persisted.
 *   - DELETE: the HAS_PRODUCTS guard refuses to delete a category that still
 *     owns products (409) and only deletes an empty one (200).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  category: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { category: mocks.category } }))

import { POST } from '@/app/api/categories/route'
import { DELETE } from '@/app/api/categories/[id]/route'

const ADMIN_SESSION = { user: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' } }
const CUSTOMER_SESSION = { user: { id: 'u-cust', email: 'cust@example.com', role: 'CUSTOMER' } }

const VALID_BODY = {
  name: 'Die-cut stickers',
  slug: 'die-cut-stickers',
  description: 'Kiss-cut vinyl for laptops',
  icon: 'Scissors',
  image: 'https://example.com/cats/die-cut.png',
}

function jsonRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/categories (admin guard)', () => {
  it('rejects an unauthenticated caller with 401 UNAUTHENTICATED', async () => {
    mocks.auth.mockResolvedValue(null)
    const res = await POST(jsonRequest('POST', 'http://localhost/api/categories', VALID_BODY))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('UNAUTHENTICATED')
    expect(mocks.category.create).not.toHaveBeenCalled()
  })

  it('rejects a non-admin caller with 403 FORBIDDEN', async () => {
    mocks.auth.mockResolvedValue(CUSTOMER_SESSION)
    const res = await POST(jsonRequest('POST', 'http://localhost/api/categories', VALID_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('FORBIDDEN')
    expect(mocks.category.create).not.toHaveBeenCalled()
  })

  it('rejects an invalid body with 400 VALIDATION', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const res = await POST(jsonRequest('POST', 'http://localhost/api/categories', { name: 'x' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('VALIDATION')
    expect(mocks.category.create).not.toHaveBeenCalled()
  })

  it('creates the category with icon/image for a valid admin payload (201)', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    const created = { id: 'cat-1', ...VALID_BODY, isActive: true, sortOrder: 0 }
    mocks.category.create.mockResolvedValue(created)

    const res = await POST(jsonRequest('POST', 'http://localhost/api/categories', VALID_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.category).toEqual(created)
    expect(mocks.category.create).toHaveBeenCalledTimes(1)
    expect(mocks.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: VALID_BODY.name,
        slug: VALID_BODY.slug,
        icon: VALID_BODY.icon,
        image: VALID_BODY.image,
      }),
    })
  })
})

describe('DELETE /api/categories/[id] (HAS_PRODUCTS guard)', () => {
  const params = { params: { id: 'cat-1' } }

  it('rejects an unauthenticated caller with 401', async () => {
    mocks.auth.mockResolvedValue(null)
    const res = await DELETE(jsonRequest('DELETE', 'http://localhost/api/categories/cat-1'), params)
    expect(res.status).toBe(401)
    expect(mocks.category.delete).not.toHaveBeenCalled()
  })

  it('returns 404 when the category does not exist', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    mocks.category.findUnique.mockResolvedValue(null)
    const res = await DELETE(jsonRequest('DELETE', 'http://localhost/api/categories/cat-1'), params)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
    expect(mocks.category.delete).not.toHaveBeenCalled()
  })

  it('refuses to delete a category that still owns products (409 HAS_PRODUCTS)', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    mocks.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Die-cut stickers',
      _count: { products: 3 },
    })
    const res = await DELETE(jsonRequest('DELETE', 'http://localhost/api/categories/cat-1'), params)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.code).toBe('HAS_PRODUCTS')
    expect(mocks.category.delete).not.toHaveBeenCalled()
  })

  it('deletes an empty category (200)', async () => {
    mocks.auth.mockResolvedValue(ADMIN_SESSION)
    mocks.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Die-cut stickers',
      _count: { products: 0 },
    })
    mocks.category.delete.mockResolvedValue({ id: 'cat-1' })

    const res = await DELETE(jsonRequest('DELETE', 'http://localhost/api/categories/cat-1'), params)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mocks.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })
})
