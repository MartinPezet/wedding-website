// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

// the real composable hands back a ref, which the template unwraps — a plain
// boolean here behaves the same and avoids a hoisted import of `ref`
const session = vi.hoisted(() => ({ loggedIn: false }))
mockNuxtImport('useUserSession', () => () => ({ loggedIn: session.loggedIn }))

const layout = async () => (await import('../../app/layouts/default.vue')).default

describe('default layout navigation', () => {
  it('offers no navigation to a visitor without a session', async () => {
    session.loggedIn = false
    const wrapper = await mountSuspended(await layout())
    // the gate is what unlocks the site; showing links to gated pages before
    // that just bounces the visitor back to /welcome
    expect(wrapper.find('#site-nav').exists()).toBe(false)
    expect(wrapper.find('[aria-controls="site-nav"]').exists()).toBe(false)
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).not.toContain('/schedule')
  })

  it('shows the full navigation once signed in', async () => {
    session.loggedIn = true
    const wrapper = await mountSuspended(await layout())
    expect(wrapper.find('#site-nav').exists()).toBe(true)
    const hrefs = wrapper.findAll('#site-nav a').map(link => link.attributes('href'))
    expect(hrefs).toEqual(['/', '/schedule', '/rsvp', '/gifts', '/travel', '/faq'])
  })
})
