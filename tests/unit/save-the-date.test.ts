// @vitest-environment node
import { readFileSync } from 'node:fs'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

mockNuxtImport('useUserSession', () => () => ({ loggedIn: { value: false } }))
mockNuxtImport('navigateTo', () => (to: string) => to)

describe('save the date page', () => {
  it('is reachable without a session', async () => {
    const middleware = (await import('../../app/middleware/auth.global')).default as unknown as
      (to: { path: string }) => unknown
    expect(middleware({ path: '/save-the-date' })).toBeUndefined()
  })

  it('renders the floral arch without site navigation', () => {
    const page = readFileSync('app/pages/save-the-date.vue', 'utf8')
    // opts out of the default layout so the nav header never renders
    expect(page).toContain('layout: false')
    expect(page).toContain('FloralArch')
    expect(page).toContain('FloralHeader')
    expect(page).not.toContain('site-nav')
  })
})
