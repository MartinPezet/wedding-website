import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

// Output contract for the one-time Turso provisioning script: --dry-run must
// print, without touching the turso CLI, where every secret goes.
describe('scripts/setup-turso.mjs --dry-run', () => {
  const output = () =>
    execFileSync('node', ['scripts/setup-turso.mjs', '--dry-run'], { encoding: 'utf8' })

  it('names both Turso secrets', () => {
    const out = output()
    expect(out).toContain('TURSO_DATABASE_URL')
    expect(out).toContain('TURSO_AUTH_TOKEN')
  })

  it('says where each secret lives (GitHub Actions + Amplify via tfvars)', () => {
    const out = output()
    expect(out).toMatch(/GitHub Actions secret/i)
    expect(out).toMatch(/terraform\.tfvars/)
    expect(out).toContain('turso_database_url')
    expect(out).toContain('turso_auth_token')
  })

  it('documents the turso commands it would run', () => {
    const out = output()
    expect(out).toContain('turso db create')
    expect(out).toContain('turso db tokens create')
  })
})
