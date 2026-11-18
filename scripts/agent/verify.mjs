#!/usr/bin/env node
/**
 * scripts/agent/verify.mjs — tiered verification orchestrator (Pass 1.5)
 *
 * Usage:
 *   node scripts/agent/verify.mjs plan [--json]   # dry-run: print what would run
 *   node scripts/agent/verify.mjs fast            # L0+L1: type-check + lint + mapped unit tests
 *   node scripts/agent/verify.mjs mid             # L2: fast + FULL unit suite
 *   node scripts/agent/verify.mjs full            # L4: type-check + lint + test:run + build + e2e (CI/release)
 *
 * Maps changed files (git diff HEAD + untracked) through .agent/testing/test-map.yml.
 * No dependencies — the test-map parser below handles the simple YAML subset we use.
 * Exit code: 0 = all selected checks passed; 1 = a check failed; 2 = usage/setup error.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const invoked = process.argv.slice(2)
const tier = invoked[0] || 'plan'
const asJson = invoked.includes('--json')
if (!['plan', 'fast', 'mid', 'full'].includes(tier)) {
  console.error(`usage: verify.mjs <plan|fast|mid|full> [--json]`)
  process.exit(2)
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', shell: false, ...opts }).status ?? 1

/** ---- YAML subset parser for .agent/testing/test-map.yml ---- */
function parseTestMap(file) {
  const modules = {}
  let cur = null
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.match(/^\s*/)[0].length
    const trimmed = line.trim()
    if (trimmed === 'modules:') continue
    if (indent === 2 && trimmed.endsWith(':')) {
      cur = trimmed.slice(0, -1)
      modules[cur] = { source: [], unit: [], e2e_hint: [], shared_footprint: false }
      continue
    }
    if (indent === 4 && cur) {
      const m = trimmed.match(/^([a-z_]+):\s*(.*)$/)
      if (!m) continue
      const [, key, rest] = m
      if (key === 'shared_footprint') modules[cur].shared_footprint = rest.trim() === 'true'
      else if (rest.startsWith('[')) {
        const items = rest.replace(/^\[/, '').replace(/\]$/, '').split(',').map(s => s.trim()).filter(Boolean)
        modules[cur][key] = items
      }
    }
  }
  return modules
}

const globToRegExp = (glob) => {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp('^' + esc.replace(/\*\*\//g, '(.*/)?').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '$')
}
const matchAny = (file, globs) => globs.some(g => globToRegExp(g).test(file))

/** ---- changed files ---- */
function changedFiles() {
  const out = new Set()
  const collect = (args) => {
    const r = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    if (r.status === 0) r.stdout.split('\n').filter(Boolean).forEach(f => out.add(f))
  }
  collect(['diff', '--name-only', 'HEAD'])
  collect(['diff', '--name-only', '--cached'])
  collect(['ls-files', '--others', '--exclude-standard'])
  return [...out]
}

/** ---- risk classification ---- */
const CRITICAL = [/^\.github\/workflows\//, /^package\.json$/, /^pnpm-lock\.yaml$/, /^prisma\/schema/, /^next\.config\./, /^tsconfig\.json$/, /^tailwind\.config\./]
const HIGH = [/^src\/lib\/api-utils\.ts$/, /^src\/lib\/prisma\.ts$/, /^src\/lib\/utils\.ts$/, /^src\/lib\/auth\.ts$/, /^src\/middleware\.ts$/, /^src\/auth\.config\.ts$/, /^src\/lib\/pricing\.ts$/, /^src\/lib\/order-status\.ts$/, /^src\/app\/globals\.css$/, /^tokens\//, /^vitest\.config\.ts$/, /^playwright\.config\.ts$/]
const LOW = [/^docs\//, /\.md$/, /^public\//, /^e2e\//]
function classify(files, testMap) {
  const isCrit = files.some(f => CRITICAL.some(re => re.test(f)))
  if (isCrit) return 'critical'
  const isHigh = files.some(f => HIGH.some(re => re.test(f)) || Object.values(testMap).some(m => m.shared_footprint && matchAny(f, m.source)))
  if (isHigh) return 'high'
  if (files.every(f => LOW.some(re => re.test(f)))) return 'low'
  return 'medium'
}

/** ---- selection ---- */
function select(files, testMap) {
  const selectedTests = new Set()
  let footprint = false
  for (const [name, mod] of Object.entries(testMap)) {
    const hit = files.some(f => matchAny(f, mod.source))
    if (hit) {
      mod.unit.forEach(t => selectedTests.add(t))
      if (mod.shared_footprint) footprint = true
    }
  }
  return { selectedTests: [...selectedTests], footprint }
}

const testMapPath = path.join(repoRoot, '.agent/testing/test-map.yml')
const testMap = fs.existsSync(testMapPath) ? parseTestMap(testMapPath) : {}
const files = changedFiles()
const risk = classify(files, testMap)
const { selectedTests, footprint } = select(files, testMap)
const widenAll = risk === 'critical' || risk === 'high' || footprint
const unitGlobs = widenAll ? ['(all unit tests)'] : selectedTests.length ? selectedTests : ['(no mapped tests — lint/type-check only)']
const selectedChecks = ['type-check', 'lint']
if (risk !== 'critical') selectedChecks.push(...(widenAll ? ['unit:all'] : selectedTests.length ? ['unit:mapped'] : []))
const plan = {
  risk,
  changed_files: files.length,
  changed: files,
  selected_checks: selectedChecks,
  mapped_tests: unitGlobs,
  skipped_checks: risk === 'critical' ? ['e2e'] : ['build', 'e2e', 'full-regression'],
  estimated_scope: widenAll || risk === 'critical' ? 'broad' : selectedTests.length ? 'focused' : 'static-only',
  execution_required: tier !== 'plan',
}

if (tier === 'plan') {
  if (asJson) console.log(JSON.stringify(plan))
  else {
    console.log(`risk: ${plan.risk}\nchanged files: ${plan.changed_files}`)
    for (const f of files) console.log(`  ~ ${f}`)
    console.log(`selected: ${plan.selected_checks.join(', ')}`)
    console.log(`mapped tests: ${plan.mapped_tests.join(', ')}`)
    console.log(`skipped: ${plan.skipped_checks.join(', ')}`)
    console.log(`estimated scope: ${plan.estimated_scope}`)
  }
  process.exit(0)
}

let failed = 0
const step = (name, cmd, args) => {
  console.log(`\n▶ ${name}\n$ ${cmd} ${args.join(' ')}`)
  const code = run(cmd, args)
  if (code !== 0) { console.error(`✗ ${name} failed (exit ${code})`); failed = code }
  return code
}

if (tier === 'fast' || tier === 'mid' || tier === 'full') {
  step('type-check', pnpm, ['type-check'])
  if (failed === 0) step('lint', pnpm, ['lint'])
}
if (tier === 'fast') {
  if (failed === 0) {
    if (widenAll) step('unit:all', pnpm, ['test:run'])
    else if (selectedTests.length) step('unit:mapped', pnpm, ['exec', 'vitest', 'run', ...selectedTests])
    else console.log('\n(no mapped unit tests for changed files — static checks only)')
  }
}
if (tier === 'mid') {
  if (failed === 0) step('unit:all', pnpm, ['test:run'])
}
if (tier === 'full') {
  if (failed === 0) step('unit:all', pnpm, ['test:run'])
  if (failed === 0) step('build', pnpm, ['build'])
  if (failed === 0) step('e2e', pnpm, ['e2e'])
}
process.exit(failed)
