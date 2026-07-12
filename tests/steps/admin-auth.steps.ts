// @vitest-environment node
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { expect, vi } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/admin-auth.feature')

interface FakeEvent {
  ip?: string
  path?: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
  session?: Record<string, unknown> | null
}

mockNuxtImport('useRuntimeConfig', () => () => ({ adminPassword: 'admin-secret', backupSecret: 'backup-secret' }))
mockNuxtImport('navigateTo', () => (to: string) => to)
// session shape injected per scenario via this holder
const sessionHolder: { session: Record<string, unknown> | null } = { session: null }
mockNuxtImport('useUserSession', () => () => ({
  loggedIn: { value: Boolean(sessionHolder.session?.user) },
  session: { value: sessionHolder.session },
}))

vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('readBody', async (event: FakeEvent) => event.body)
vi.stubGlobal('getRequestIP', (event: FakeEvent) => event.ip ?? 'test-ip')
vi.stubGlobal('getHeader', (event: FakeEvent, name: string) => event.headers?.[name.toLowerCase()])
vi.stubGlobal('setUserSession', async (event: FakeEvent, data: Record<string, unknown>) => {
  event.session = { ...event.session, ...data }
})
vi.stubGlobal('getUserSession', async (event: FakeEvent) => event.session ?? null)

type Handler = (event: FakeEvent) => Promise<unknown>

const loginHandler = async (): Promise<Handler> =>
  (await import('../../server/api/admin/login.post')).default as unknown as Handler

const adminGuard = async (): Promise<Handler> =>
  (await import('../../server/middleware/admin-guard')).default as unknown as Handler

const uiMiddleware = async () =>
  (await import('../../app/middleware/auth.global')).default as unknown as
  (to: { path: string }) => unknown

describeFeature(feature, (f) => {
  f.Rule('Admin area requires separate login', (r) => {
    r.RuleScenario('Guest session cannot reach admin', (s) => {
      const event: FakeEvent = { path: '/api/admin/stats', session: { user: { guest: true } } }
      let uiResult: unknown
      let apiError: { statusCode?: number } | undefined
      s.Given('a visitor with only a public-site session', () => {
        sessionHolder.session = { user: { guest: true } }
      })
      s.When('they request an admin page or admin API route', async () => {
        uiResult = (await uiMiddleware())({ path: '/admin' })
        apiError = await (await adminGuard())(event).then(() => undefined, error => error)
      })
      s.Then('access is denied and they are redirected to the admin login', () => {
        expect(uiResult).toBe('/admin/login')
        expect(apiError?.statusCode).toBe(401)
      })
    })

    r.RuleScenario('Admin login succeeds', (s) => {
      const event: FakeEvent = { ip: 'ip-admin-ok', body: { password: 'admin-secret' } }
      let result: unknown
      s.Given('the admin login page', () => {})
      s.When('the correct admin password is submitted', async () => {
        result = await (await loginHandler())(event)
      })
      s.Then('an admin session is established and admin pages become accessible', async () => {
        expect(result).toEqual({ ok: true })
        expect(event.session).toMatchObject({ admin: true })
        sessionHolder.session = event.session
        expect((await uiMiddleware())({ path: '/admin' })).toBeUndefined()
        await expect((await adminGuard())({ path: '/api/admin/stats', session: event.session })).resolves.toBeUndefined()
      })
    })
  })

  f.Rule('Admin login is rate limited', (r) => {
    r.RuleScenario('Brute force throttled', (s) => {
      const attempt = async () =>
        (await loginHandler())({ ip: 'ip-admin-throttled', body: { password: 'nope' } })
          .then(() => undefined, (error: { statusCode?: number }) => error)
      s.Given('a client that has failed admin login 5 times in a short window', async () => {
        for (let i = 0; i < 5; i++) {
          expect((await attempt())?.statusCode).toBe(401)
        }
      })
      let thrown: { statusCode?: number } | undefined
      s.When('it attempts again', async () => {
        thrown = await attempt()
      })
      s.Then('the attempt is delayed or rejected', () => {
        expect(thrown?.statusCode).toBe(429)
      })
    })
  })

  f.Rule('Admin API enforced server-side', (r) => {
    r.RuleScenario('Direct API call without session', (s) => {
      const event: FakeEvent = { path: '/api/admin/parties' }
      let thrown: { statusCode?: number } | undefined
      s.Given('no valid admin session or backup bearer secret', () => {
        event.session = null
      })
      s.When('an admin API endpoint is called directly', async () => {
        thrown = await (await adminGuard())(event).then(() => undefined, error => error)
      })
      s.Then('the request is rejected with an authorisation error', () => {
        expect(thrown?.statusCode).toBe(401)
      })
    })
  })
})
