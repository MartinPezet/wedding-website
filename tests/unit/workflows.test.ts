import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Static assertions on the GitHub Actions workflows: deploy ordering,
// PR checks present, backup cron. Text-level on purpose — the workflows are
// ours and small; a YAML parser adds nothing these can't catch.
const read = (name: string) => readFileSync(`.github/workflows/${name}`, 'utf8')

describe('deploy.yml', () => {
  const yml = () => read('deploy.yml')

  it('runs on push to main', () => {
    expect(yml()).toMatch(/on:\s*\n\s*push:\s*\n\s*branches:\s*\[?\s*-?\s*['"]?main/)
  })

  it('orders terraform apply -> migrate -> amplify build trigger', () => {
    const y = yml()
    const apply = y.indexOf('terraform')
    const migrate = y.indexOf('migrate')
    const build = y.indexOf('amplify start-job')
    expect(apply).toBeGreaterThan(-1)
    expect(migrate).toBeGreaterThan(apply)
    expect(build).toBeGreaterThan(migrate)
  })

  it('lets a migration failure halt the deploy (no continue-on-error)', () => {
    expect(yml()).not.toContain('continue-on-error')
  })
})

describe('pr.yml', () => {
  const yml = () => read('pr.yml')

  it('runs on pull requests', () => {
    expect(yml()).toContain('pull_request')
  })

  it('runs lint, typecheck, terraform plan, and migration dry-run', () => {
    const y = yml()
    expect(y).toContain('npm run lint')
    expect(y).toContain('npm run typecheck')
    expect(y).toContain('terraform')
    expect(y).toContain('plan')
    expect(y).toContain('drizzle-kit')
  })
})

describe('backup.yml', () => {
  const yml = () => read('backup.yml')

  it('runs on a nightly cron', () => {
    expect(yml()).toMatch(/schedule:\s*\n\s*-\s*cron:/)
  })

  it('fetches the backup endpoint with the bearer secret', () => {
    const y = yml()
    expect(y).toContain('/api/admin/backup')
    expect(y).toContain('Authorization: Bearer')
    expect(y).toContain('BACKUP_SECRET')
  })

  it('uploads a dated dump to S3 and as a workflow artifact', () => {
    const y = yml()
    expect(y).toContain('aws s3 cp')
    expect(y).toContain('upload-artifact')
  })
})
