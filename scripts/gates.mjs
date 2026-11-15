#!/usr/bin/env node
/**
 * pnpm verify — the pre-commit gate for the Bioscope frontend rebuild.
 *
 * Runs the five gates in order and stops at the first failure:
 *   1. pnpm type-check
 *   2. pnpm lint
 *   3. pnpm test:run
 *   4. pnpm build
 *   5. node .gitnexus/run.cjs detect-changes --scope all --repo .
 *
 * Exits non-zero on the first failing gate. `pnpm build` may be skipped only
 * when a task explicitly says so, by setting VERIFY_SKIP_BUILD=1.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const skipBuild = process.env.VERIFY_SKIP_BUILD === '1'

const gates = [
  { name: 'type-check', command: pnpm, args: ['type-check'] },
  { name: 'lint', command: pnpm, args: ['lint'] },
  { name: 'test:run', command: pnpm, args: ['test:run'] },
  {
    name: 'build',
    command: pnpm,
    args: ['build'],
    skip: skipBuild,
    skipReason: 'VERIFY_SKIP_BUILD=1 is set',
  },
  {
    name: 'detect-changes',
    command: process.execPath,
    args: ['.gitnexus/run.cjs', 'detect-changes', '--scope', 'all', '--repo', 'bioscope'],
  },
]

const plural = gates.length === 1 ? 'gate' : 'gates'
console.log(`\npnpm verify — running ${gates.length} ${plural} in ${repoRoot}\n`)

let failed = null

for (const [index, gate] of gates.entries()) {
  const position = `${index + 1}/${gates.length}`
  if (gate.skip) {
    console.log(`▶ ${position} ${gate.name} — SKIPPED (${gate.skipReason})`)
    continue
  }

  console.log(`▶ ${position} ${gate.name}`)
  console.log(`$ ${gate.command} ${gate.args.join(' ')}`)

  const result = spawnSync(gate.command, gate.args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) {
    console.error(`\n✗ ${gate.name} failed to start: ${result.error.message}`)
    failed = gate
    break
  }

  if (result.status !== 0) {
    const code = result.status ?? 'signal'
    console.error(`\n✗ ${gate.name} failed (exit ${code})`)
    failed = gate
    break
  }

  console.log(`✓ ${gate.name} passed\n`)
}

if (failed) {
  console.error(`\n✗ verify failed at gate "${failed.name}". Fix it and run \`pnpm verify\` again.\n`)
  process.exit(1)
}

console.log('✓ all gates passed\n')
