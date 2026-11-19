#!/usr/bin/env node
/**
 * Credentialed smoke helper — drives the REAL auth surface (CSRF + credentials
 * callback) and probes protected routes with a held cookie jar.
 *
 * Usage:
 *   node scripts/credentialed-smoke.mjs            # admin sign-in + default probes
 *   node scripts/credentialed-smoke.mjs customer   # register/sign-in a throwaway customer
 *
 * Importable: `import { signIn, registerCustomer, api } from './scripts/credentialed-smoke.mjs'`
 * Credentials come from .env (ADMIN_EMAIL/ADMIN_PASSWORD) — never printed.
 * Run from the project root. No PII in output: roles, counts, status codes only.
 */
import { readFileSync } from 'node:fs'

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

function envFile() {
  const out = {}
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env — env vars may still be set */ }
  return out
}

export function makeJar() {
  const jar = new Map()
  return {
    absorb(res) {
      for (const c of res.headers.getSetCookie()) {
        const p = c.split(';')[0]
        const i = p.indexOf('=')
        jar.set(p.slice(0, i), p.slice(i + 1))
      }
    },
    header() {
      return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    },
  }
}

export async function signIn(email, password, jar = makeJar()) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  jar.absorb(csrfRes)
  const { csrfToken } = await csrfRes.json()
  const login = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: jar.header() },
    body: new URLSearchParams({ csrfToken, email, password, json: 'true' }),
  })
  jar.absorb(login)
  const session = await (await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: jar.header() } })).json()
  return { jar, session, location: login.headers.get('location') }
}

export async function registerCustomer(tag = 'smoke') {
  const email = `${tag}-${Date.now()}@example.com`
  const password = `Sm0ke-${Math.random().toString(36).slice(2)}!`
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Smoke Tester', email, password }),
  })
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`register failed: ${res.status} ${await res.text()}`)
  }
  const { jar, session } = await signIn(email, password)
  return { jar, session, email, password }
}

export async function api(path, { jar, method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      ...(jar ? { Cookie: jar.header() } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers }
}

async function main() {
  const mode = process.argv[2] ?? 'admin'
  const env = { ...envFile(), ...process.env }
  let ctx
  if (mode === 'admin') {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL/ADMIN_PASSWORD not set')
    ctx = await signIn(env.ADMIN_EMAIL, env.ADMIN_PASSWORD)
  } else {
    ctx = await registerCustomer(mode === 'customer' ? 'smoke' : mode)
  }
  const role = ctx.session?.user?.role
  console.log(`sign-in: role=${role ?? 'NONE'} location=${ctx.location ?? '-'}`)
  if (!role) throw new Error('sign-in failed — no session')

  if (mode === 'admin') {
    const orders = await api('/api/analytics/orders?range=30d', ctx)
    console.log(`analytics/orders: ${orders.status} total=${orders.json?.data?.total} today=${JSON.stringify(orders.json?.data?.today)}`)
    const dash = await api('/admin/dashboard', ctx)
    console.log(`admin/dashboard page: ${dash.status}`)
    const analytics = await api('/admin/analytics', ctx)
    console.log(`admin/analytics page: ${analytics.status}`)
    if (orders.status !== 200 || typeof orders.json?.data?.today?.orders !== 'number') {
      throw new Error('today block missing or wrong shape')
    }
  } else {
    const me = await api('/api/user/me', ctx)
    console.log(`user/me: ${me.status} name=${me.json?.data?.user?.name ?? '-'}`)
    const profile = await api('/profile', ctx)
    console.log(`profile page: ${profile.status}`)
  }
  console.log('SMOKE OK')
}

if (process.argv[1] && process.argv[1].endsWith('credentialed-smoke.mjs')) {
  main().catch((e) => { console.error('SMOKE FAIL:', e.message); process.exit(1) })
}