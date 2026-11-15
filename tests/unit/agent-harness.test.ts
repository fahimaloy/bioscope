/**
 * Agent-harness self-check (Pass 1.5).
 * Guards the verification contract: files exist, AGENTS.md carries the
 * machine-readable tier commands, and the plan dry-run emits the expected
 * JSON envelope. Additive gate — safe alongside existing unit tests.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(__dirname, '..', '..')
const fromRoot = (p: string) => path.join(root, p)

describe('agent verification harness', () => {
  it('.agent tree exists with the load-bearing files', () => {
    for (const p of [
      '.agent/README.md',
      '.agent/rules/verification-policy.md',
      '.agent/testing/test-strategy.md',
      '.agent/testing/test-map.yml',
      '.agent/testing/known-baseline-failures.md',
      'scripts/agent/verify.mjs',
      '.github/workflows/nightly.yml',
    ]) {
      expect(existsSync(fromRoot(p)), p).toBe(true)
    }
  })

  it('AGENTS.md publishes machine-readable tier commands', () => {
    const agents = readFileSync(fromRoot('AGENTS.md'), 'utf8')
    expect(agents).toContain('RUN_FAST_TESTS: pnpm verify:fast')
    expect(agents).toContain('RUN_MID_TESTS: pnpm verify:mid')
    expect(agents).toContain('RUN_FULL_SUITE: pnpm verify:full')
  })

  it('test-map.yml parses as the simple YAML subset verify.mjs expects', () => {
    const map = readFileSync(fromRoot('.agent/testing/test-map.yml'), 'utf8')
    expect(map).toContain('modules:')
    expect(map).toContain('pricing:')
    expect(map).toContain('shared_footprint: true')
  })

  it('verify.mjs plan --json emits the expected envelope', () => {
    const out = execFileSync(process.execPath, ['scripts/agent/verify.mjs', 'plan', '--json'], {
      cwd: root,
      encoding: 'utf8',
    })
    const plan = JSON.parse(out) as Record<string, unknown>
    for (const key of ['risk', 'changed_files', 'selected_checks', 'skipped_checks', 'estimated_scope', 'execution_required']) {
      expect(plan, key).toHaveProperty(key)
    }
    expect(['low', 'medium', 'high', 'critical']).toContain(plan.risk)
  })
})
