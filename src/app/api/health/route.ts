import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * D5 — liveness/readiness probe. Public (no auth) so uptime monitors and load
 * balancers can poll it. Probes the DB with a trivial `SELECT 1`; returns 200
 * when up, 503 when the DB is unreachable. Plain JSON (monitoring convention)
 * rather than the ok() envelope. Never throws — a probe must always answer.
 */
export async function GET() {
  const started = Date.now()
  const timestamp = new Date().toISOString()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      { status: 'ok', db: 'up', latencyMs: Date.now() - started, timestamp },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'down', timestamp },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
