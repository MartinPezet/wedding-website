// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { expect, vi } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/save-the-date.feature')

const page = () => readFileSync('app/pages/save-the-date.vue', 'utf8')

interface FakeEvent {
  ip?: string
  body?: Record<string, unknown>
}

mockNuxtImport('useUserSession', () => () => ({ loggedIn: { value: false } }))
mockNuxtImport('navigateTo', () => (to: string) => to)
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('readBody', async (event: FakeEvent) => event.body)
vi.stubGlobal('getRequestIP', (event: FakeEvent) => event.ip ?? 'test-ip')

type Handler = (event: FakeEvent) => Promise<unknown>
type Thrown = { statusCode?: number, message?: string }

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  vi.stubGlobal('useDb', () => db)
  return db
}

type Db = Awaited<ReturnType<typeof freshDb>>

/** a fresh module instance per scenario, so the in-memory rate limiter starts clean */
const handler = async (): Promise<Handler> => {
  vi.resetModules()
  return (await import('../../server/api/save-the-date.post')).default as unknown as Handler
}

const post = async (h: Handler, body: Record<string, unknown>, ip = 'test-ip') =>
  h({ ip, body }).then(
    result => ({ result, thrown: undefined as Thrown | undefined }),
    (error: Thrown) => ({ result: undefined, thrown: error }),
  )

const responses = async (db: Db) => {
  const { listResponses } = await import('../../server/utils/save-the-date')
  return listResponses(db)
}

const valid = {
  name: 'The Windsors',
  phone: '07911 123456',
  addressLine1: '12 Orchard Lane',
  addressLine2: 'Nether Stowey',
  city: 'Bridgwater',
  postcode: 'TA5 1AA',
  country: 'United Kingdom',
  stayNightBefore: false,
  stayNightOf: false,
}

describeFeature(feature, (f) => {
  f.Rule('Public save-the-date page', (r) => {
    r.RuleScenario('Visitor without a session', (s) => {
      let outcome: unknown
      s.Given('a visitor with no session', () => {})
      s.When('the route middleware evaluates a request for "/save-the-date"', async () => {
        const middleware = (await import('../../app/middleware/auth.global')).default as unknown as
          (to: { path: string }) => unknown
        outcome = middleware({ path: '/save-the-date' })
      })
      s.Then('the request proceeds with no redirect to the password gate and the page opts out of the default layout', () => {
        expect(outcome).toBeUndefined()
        expect(page()).toContain('layout: false')
      })
    })

    r.RuleScenario('Link preview tags present', (s) => {
      let source = ''
      s.Given('the save-the-date page', () => {
        source = page()
      })
      s.When('its meta tags are inspected', () => {})
      s.Then('Open Graph title, description, and image tags are set naming the couple and the wedding date', () => {
        expect(source).toMatch(/ogTitle:/)
        expect(source).toMatch(/ogDescription:/)
        expect(source).toMatch(/ogImage:/)
        expect(source).toContain('Ciera')
        expect(source).toContain('longDate')
      })
    })
  })

  f.Rule('Booked date and venue announced', (r) => {
    r.RuleScenario('Date and venue shown from content', (s) => {
      let source = ''
      s.Given('schedule content with a wedding date and venue content with a name, county, and website', () => {})
      s.When('a visitor views the save-the-date page', () => {
        source = page()
      })
      s.Then('the long-form date, venue name, and county from the content are displayed and the venue name links to the venue website', async () => {
        const { venue } = await import('#shared/content')
        expect(source).toMatch(/import \{[^}]*venue[^}]*\} from ["']#shared\/content["']/)
        expect(source).toContain('venue.name')
        expect(source).toContain('venue.county')
        expect(source).toContain('venue.url')
        expect(venue.url).toMatch(/^https:\/\//)
      })
    })

    r.RuleScenario('Content edit changes the page', (s) => {
      let source = ''
      s.Given('the date and venue edited in the schedule content', () => {})
      s.When('the page renders', () => {
        source = page()
      })
      s.Then('it shows the new values with no component changes', () => {
        // nothing venue-specific is hard-coded in the template
        expect(source).not.toMatch(/Devon|Huntsham|St Audries|Somerset/)
      })
    })
  })

  f.Rule('Household interest form', (r) => {
    r.RuleScenario('Complete submission accepted', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a household with a name, a valid phone number, and a complete address', async () => {
        db = await freshDb()
      })
      s.When('the form is submitted', async () => {
        outcome = await post(await handler(), valid)
      })
      s.Then('the response is stored with the phone normalised to E.164 and a confirmation message replaces the form', async () => {
        expect(outcome.thrown).toBeUndefined()
        expect(outcome.result).toMatchObject({ ok: true })
        expect(await responses(db)).toMatchObject([{ phone: '+447911123456', name: 'The Windsors' }])
        // the page swaps the form for a confirmation panel on success
        expect(page()).toMatch(/submitted/)
      })
    })

    r.RuleScenario('Missing required field rejected', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a submission omitting the name, phone, address line 1, town/city, postcode, or country', async () => {
        db = await freshDb()
      })
      s.When('it is submitted', async () => {
        outcome = await post(await handler(), { ...valid, city: '   ' })
      })
      s.Then('a validation error naming the missing field is shown and nothing is stored', async () => {
        expect(outcome.thrown?.statusCode).toBe(400)
        expect(outcome.thrown?.message).toMatch(/town or city/i)
        expect(await responses(db)).toHaveLength(0)
      })
    })

    r.RuleScenario('Invalid phone rejected', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a submission carrying "not a phone" as the phone number', async () => {
        db = await freshDb()
      })
      s.When('it is submitted', async () => {
        outcome = await post(await handler(), { ...valid, phone: 'not a phone' })
      })
      s.Then('a validation error is shown and nothing is stored', async () => {
        expect(outcome.thrown?.statusCode).toBe(400)
        expect(outcome.thrown?.message).toMatch(/phone/i)
        expect(await responses(db)).toHaveLength(0)
      })
    })

    r.RuleScenario('Over-long field rejected', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a submission whose name exceeds the field length cap', async () => {
        db = await freshDb()
      })
      s.When('it is submitted', async () => {
        outcome = await post(await handler(), { ...valid, name: 'x'.repeat(500) })
      })
      s.Then('the submission is rejected and nothing is stored', async () => {
        expect(outcome.thrown?.statusCode).toBe(400)
        expect(await responses(db)).toHaveLength(0)
      })
    })
  })

  f.Rule('Room-night interest', (r) => {
    r.RuleScenario('Both nights of interest', (s) => {
      let db: Db
      s.Given('a household ticking both the night-before and night-of checkboxes', async () => {
        db = await freshDb()
      })
      s.When('the form is submitted', async () => {
        await post(await handler(), { ...valid, stayNightBefore: true, stayNightOf: true })
      })
      s.Then('both interest flags are stored as true against that household', async () => {
        expect(await responses(db)).toMatchObject([{ stayNightBefore: true, stayNightOf: true }])
      })
    })

    r.RuleScenario('No rooms wanted', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a household with neither checkbox ticked', async () => {
        db = await freshDb()
      })
      s.When('the form is submitted', async () => {
        outcome = await post(await handler(), valid)
      })
      s.Then('the submission is accepted and both interest flags are stored as false', async () => {
        expect(outcome.thrown).toBeUndefined()
        expect(await responses(db)).toMatchObject([{ stayNightBefore: false, stayNightOf: false }])
      })
    })

    r.RuleScenario('Interest is not a booking', (s) => {
      let source = ''
      s.Given('the room-night section of the page', () => {})
      s.When('its copy is inspected', () => {
        source = page()
      })
      s.Then('it states the approximate per-room-per-night rate, that dinner and breakfast are included, and that ticking gauges interest rather than reserving a room', () => {
        expect(source).toMatch(/£200/)
        expect(source).toMatch(/dinner/i)
        expect(source).toMatch(/breakfast/i)
        expect(source).toMatch(/interest/i)
        expect(source).toMatch(/not a booking|does not book|doesn't book|gauge/i)
      })
    })
  })

  f.Rule('Public submissions are validated and rate limited', (r) => {
    r.RuleScenario('Client-side bypass rejected', (s) => {
      let db: Db
      let outcome: Awaited<ReturnType<typeof post>>
      s.Given('a request posted directly to the save-the-date endpoint with a missing required field', async () => {
        db = await freshDb()
      })
      s.When('the server handles it', async () => {
        outcome = await post(await handler(), { ...valid, addressLine1: '' })
      })
      s.Then('it responds with a validation error and stores nothing', async () => {
        expect(outcome.thrown?.statusCode).toBe(400)
        expect(await responses(db)).toHaveLength(0)
      })
    })

    r.RuleScenario('Flooding throttled', (s) => {
      let outcome: Awaited<ReturnType<typeof post>>
      let h: Handler
      s.Given('one client IP that has exceeded the allowed number of submissions in the window', async () => {
        await freshDb()
        h = await handler()
        // distinct valid numbers so each submission is a real row, not an upsert
        const numbers = ['07911 123456', '07912 345678', '07400 123456', '07911 123457', '07912 345679']
        for (const phone of numbers) await post(h, { ...valid, phone }, 'flooder')
      })
      s.When('it posts another submission', async () => {
        outcome = await post(h, { ...valid, phone: '07400 123457' }, 'flooder')
      })
      s.Then('the submission is rejected with a try-again-later message', () => {
        expect(outcome.thrown?.statusCode).toBe(429)
        expect(outcome.thrown?.message).toMatch(/again later/i)
      })
    })
  })

  f.Rule('Resubmission updates the same household', (r) => {
    r.RuleScenario('Corrected address resubmitted', (s) => {
      let db: Db
      let h: Handler
      s.Given('a stored response for a phone number', async () => {
        db = await freshDb()
        h = await handler()
        await post(h, valid)
      })
      s.When('the same phone number is submitted again with a different address', async () => {
        await post(h, { ...valid, phone: '+44 7911 123456', addressLine1: '3 Mill Cottages' })
      })
      s.Then('the stored response carries the new address and no duplicate response exists', async () => {
        const stored = await responses(db)
        expect(stored).toHaveLength(1)
        expect(stored[0]).toMatchObject({ addressLine1: '3 Mill Cottages', phone: '+447911123456' })
      })
    })
  })

  f.Rule('Mobile-first save-the-date form', (r) => {
    r.RuleScenario('Mobile input hints', (s) => {
      let source = ''
      s.Given('the save-the-date form markup', () => {})
      s.When('its inputs are inspected', () => {
        source = page()
      })
      s.Then('the phone field uses a telephone input type and the name, phone, and address fields carry autocomplete attributes', () => {
        expect(source).toContain('type="tel"')
        for (const hint of ['name', 'tel', 'address-line1', 'address-line2', 'address-level2', 'postal-code', 'country-name']) {
          expect(source).toContain(`autocomplete="${hint}"`)
        }
      })
    })
  })
})
