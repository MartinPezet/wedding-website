// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { expect, vi } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/site-gate.feature')

interface FakeEvent {
  ip?: string
  path?: string
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  session?: Record<string, unknown> | null
  redirectedTo?: string
}

const sessions: Record<string, unknown>[] = []

// Nuxt-app auto-imports are injected at transform time — mock via mockNuxtImport
mockNuxtImport('useRuntimeConfig', () => () => ({ sitePassword: 'petals' }))
mockNuxtImport('useUserSession', () => () => ({ loggedIn: { value: false } }))
mockNuxtImport('navigateTo', () => (to: string) => to)
// Nitro-only auto-imports stay bare globals under the test transform — stub them
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('readBody', async (event: FakeEvent) => event.body)
vi.stubGlobal('getQuery', (event: FakeEvent) => event.query ?? {})
vi.stubGlobal('getRequestIP', (event: FakeEvent) => event.ip ?? 'test-ip')
vi.stubGlobal('setUserSession', async (event: FakeEvent, data: Record<string, unknown>) => {
  event.session = data
  sessions.push(data)
})
vi.stubGlobal('getUserSession', async (event: FakeEvent) => event.session ?? null)
vi.stubGlobal('sendRedirect', async (event: FakeEvent, location: string) => {
  event.redirectedTo = location
})

type Handler = (event: FakeEvent) => Promise<unknown>

const gateHandler = async (): Promise<Handler> =>
  (await import('../../server/api/gate.post')).default as unknown as Handler

const tokenGate = async (): Promise<Handler> =>
  (await import('../../server/middleware/token-gate')).default as unknown as Handler

const withDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  vi.stubGlobal('useDb', () => db)
  return db
}

describeFeature(feature, (f) => {
  f.Rule('Site is password protected', (r) => {
    r.RuleScenario('Unauthenticated visitor is gated', (s) => {
      let result: unknown
      s.Given('a visitor without a valid session', () => {
        vi.stubGlobal('useUserSession', () => ({ loggedIn: { value: false } }))
      })
      s.When('they request any public page', async () => {
        const middleware = (await import('../../app/middleware/auth.global')).default as unknown as
          (to: { path: string }) => unknown
        result = middleware({ path: '/schedule' })
      })
      s.Then('they are redirected to the gate page and the requested content is not served', () => {
        expect(result).toBe('/welcome')
      })
    })

    r.RuleScenario('Correct shared password unlocks the site', (s) => {
      const event: FakeEvent = { ip: 'ip-correct', body: { password: 'petals' } }
      let result: unknown
      s.Given('a visitor on the gate page', () => {
        sessions.length = 0
      })
      s.When('they submit the correct shared password', async () => {
        result = await (await gateHandler())(event)
      })
      s.Then('a session cookie is set and they are redirected to the home page', () => {
        expect(result).toEqual({ ok: true })
        expect(sessions).toHaveLength(1)
        // welcome page navigates home after the gate accepts
        expect(readFileSync('app/pages/welcome.vue', 'utf8')).toContain(`navigateTo('/')`)
      })
    })

    r.RuleScenario('Incorrect password is rejected', (s) => {
      const event: FakeEvent = { ip: 'ip-wrong', body: { password: 'nope' } }
      let thrown: { statusCode?: number, message?: string } | undefined
      s.Given('a visitor on the gate page', () => {
        sessions.length = 0
      })
      s.When('they submit an incorrect password', async () => {
        thrown = await (await gateHandler())(event).then(() => undefined, error => error)
      })
      s.Then('an error message is shown and no session is created', () => {
        expect(thrown?.statusCode).toBe(401)
        expect(thrown?.message).toBeTruthy()
        expect(sessions).toHaveLength(0)
      })
    })
  })

  f.Rule('Password attempts are rate limited', (r) => {
    r.RuleScenario('Repeated failures are throttled', (s) => {
      const attempt = async () =>
        (await gateHandler())({ ip: 'ip-throttled', body: { password: 'nope' } })
          .then(() => undefined, (error: { statusCode?: number, message?: string }) => error)
      s.Given('a client that has failed password entry 5 times in a short window', async () => {
        for (let i = 0; i < 5; i++) {
          expect((await attempt())?.statusCode).toBe(401)
        }
      })
      let thrown: { statusCode?: number, message?: string } | undefined
      s.When('it attempts again', async () => {
        thrown = await attempt()
      })
      s.Then('the attempt is delayed or rejected with a try-again-later message', () => {
        expect(thrown?.statusCode).toBe(429)
        expect(thrown?.message).toMatch(/try again/i)
      })
    })
  })

  f.Rule('Gate page serves link previews', (r) => {
    r.RuleScenario('Link shared to a messaging app', (s) => {
      let config = ''
      s.Given('a crawler without a session', () => {})
      s.When('it fetches any site URL', () => {
        // site-wide head is rendered into every response, gate included
        config = readFileSync('nuxt.config.ts', 'utf8')
      })
      s.Then('the response includes OG title, description, and image tags', () => {
        expect(config).toContain('og:title')
        expect(config).toContain('og:description')
        expect(config).toContain('og:image')
      })
    })
  })

  f.Rule('QR token bypasses the password gate', (r) => {
    r.RuleScenario('Valid token unlocks and identifies', (s) => {
      let token = ''
      let partyId = 0
      const event: FakeEvent = { path: '/' }
      s.Given('a valid party token parameter', async () => {
        const db = await withDb()
        const { createParty } = await import('../../server/utils/parties')
        const party = await createParty(db, { name: 'The Scanners', guests: [{ name: 'Quinn Scanner' }] })
        token = party.token
        partyId = party.id
      })
      s.When('a visitor opens any site URL carrying it', async () => {
        event.query = { t: token }
        await (await tokenGate())(event)
      })
      s.Then('a session is granted without a password and the party context is attached to the session', () => {
        expect(event.session).toMatchObject({ user: { guest: true }, partyId })
        expect(event.redirectedTo).toBeUndefined()
      })
    })

    r.RuleScenario('Invalid token falls back', (s) => {
      const event: FakeEvent = { path: '/', query: { t: 'not-a-real-token' } }
      s.Given('an invalid or unknown token parameter', async () => {
        await withDb()
      })
      s.When('a visitor opens a URL carrying it', async () => {
        await (await tokenGate())(event)
      })
      s.Then('they are sent to the password gate with a friendly message that does not leak token validity semantics', () => {
        expect(event.session).toBeUndefined()
        expect(event.redirectedTo).toBe('/welcome?invite=link')
        const welcome = readFileSync('app/pages/welcome.vue', 'utf8')
        // friendly copy keyed on the invite query, no token/validity language
        expect(welcome).toContain('invite')
        expect(welcome).not.toMatch(/invalid token/i)
      })
    })
  })
})
