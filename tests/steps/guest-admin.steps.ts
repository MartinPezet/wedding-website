// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { readBody } from 'h3'
import { clearNuxtData } from '#imports'
import { menu } from '../../shared/content'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/guest-admin.feature')

// variable path so a missing module fails scenarios, not the whole file
const adminUtil = async () => await import(`../../server/utils/${'admin'}.ts`)
const adminImport = async () => await import(`../../server/utils/${'import'}.ts`)

type Db = Awaited<ReturnType<typeof freshDb>>

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

interface SeedGuest {
  name: string
  isChild?: boolean
  phone?: string
  attending?: boolean | null
  starterChoiceId?: string | null
  mainChoiceId?: string | null
  dessertChoiceId?: string | null
}

// course id → guest field, the per-course contract under test
const COURSE_FIELDS = { starter: 'starterChoiceId', main: 'mainChoiceId', dessert: 'dessertChoiceId' } as const

const courseOptions = (courseId: keyof typeof COURSE_FIELDS) =>
  menu.courses.find(course => course.id === courseId)!.options

/** one valid adult choice per defined course */
const fullChoices = () =>
  Object.fromEntries(menu.courses.map(course => [COURSE_FIELDS[course.id], course.options[0]!.id]))

const seedParty = async (db: Db, name: string, seedGuests: SeedGuest[], responded: boolean) => {
  const { createParty } = await import('../../server/utils/parties')
  const { parties, guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const party = await createParty(db, { name, guests: seedGuests.map(seed => ({ name: seed.name, isChild: seed.isChild })) })
  if (responded) {
    await db.update(parties).set({ respondedAt: new Date().toISOString() }).where(eq(parties.id, party.id))
  }
  const rows = await db.query.guests.findMany({ where: eq(guests.partyId, party.id) })
  for (const [index, seed] of seedGuests.entries()) {
    await db.update(guests).set({
      phone: seed.phone ?? null,
      attending: seed.attending ?? null,
      starterChoiceId: seed.starterChoiceId ?? null,
      mainChoiceId: seed.mainChoiceId ?? null,
      dessertChoiceId: seed.dessertChoiceId ?? null,
    }).where(eq(guests.id, rows[index]!.id))
  }
  return party
}

const listParties = async (db: Db) => {
  const { getPartyList } = await adminUtil()
  return getPartyList(db)
}

const mountAdminPage = async (name: string) => {
  clearNuxtData()
  const page = (await import(`../../app/pages/admin/${name}.vue`)).default
  return mountSuspended(page)
}

type Wrapper = Awaited<ReturnType<typeof mountAdminPage>>

const flush = () => new Promise(resolve => setTimeout(resolve, 10))

describeFeature(feature, (f) => {
  f.Rule('Dashboard with response overview', (r) => {
    r.RuleScenario('Dashboard reflects data', (s) => {
      let db: Db
      let stats: { invited: number, responded: number, outstanding: number, attending: number, declined: number, mealTotals: { id: string, name: string, options: { id: string, name: string, count: number }[] }[] }
      let wrapper: Wrapper
      s.Given('parties and guests with a mix of RSVP states', async () => {
        db = await freshDb()
        await seedParty(db, 'The Fulls', [
          { name: 'Amy Full', phone: '+447911123456', attending: true, ...fullChoices() },
          { name: 'Ben Full', attending: true, mainChoiceId: courseOptions('main')[1]!.id },
        ], true)
        await seedParty(db, 'The Nopes', [{ name: 'Nia Nope', attending: false }], true)
        await seedParty(db, 'The Ghosts', [{ name: 'Gil Ghost' }, { name: 'Gia Ghost' }], false)
      })
      s.When('the admin opens the dashboard', async () => {
        const { getDashboardStats } = await adminUtil()
        stats = await getDashboardStats(db)
        registerEndpoint('/api/admin/stats', { method: 'GET', handler: () => stats })
        registerEndpoint('/api/admin/parties', { method: 'GET', handler: async () => ({ parties: await listParties(db) }) })
        wrapper = await mountAdminPage('index')
      })
      s.Then('invited, responded, attending, declined, and outstanding counts plus per-course meal totals match the database state', () => {
        expect(stats).toMatchObject({
          invited: 5,
          responded: 2,
          outstanding: 1,
          attending: 2,
          declined: 1,
        })
        // one totals group per defined course
        expect(stats.mealTotals.map(course => course.id)).toEqual(menu.courses.map(course => course.id))
        const byCourse = Object.fromEntries(stats.mealTotals.map(course =>
          [course.id, Object.fromEntries(course.options.map(option => [option.id, option.count]))]))
        expect(byCourse.main![courseOptions('main')[0]!.id]).toBe(1)
        expect(byCourse.main![courseOptions('main')[1]!.id]).toBe(1)
        expect(byCourse.starter![courseOptions('starter')[0]!.id]).toBe(1)
        expect(byCourse.dessert![courseOptions('dessert')[0]!.id]).toBe(1)
        const html = wrapper.html()
        expect(html).toContain(courseOptions('main')[0]!.name)
        expect(html).toContain(menu.courses[0]!.name)
        expect(html).toContain('The Fulls')
      })
    })
  })

  f.Rule('Filterable party list with chase filter', (r) => {
    r.RuleScenario('Chase list', (s) => {
      let db: Db
      let wrapper: Wrapper
      let ghostToken = ''
      s.Given('parties with and without submitted RSVPs', async () => {
        db = await freshDb()
        await seedParty(db, 'The Fulls', [{ name: 'Amy Full', attending: true, ...fullChoices() }], true)
        const ghosts = await seedParty(db, 'The Ghosts', [{ name: 'Gil Ghost', phone: '+447911123456' }], false)
        ghostToken = ghosts.token
      })
      s.When('the admin selects the not-yet-responded filter', async () => {
        registerEndpoint('/api/admin/stats', {
          method: 'GET',
          handler: async () => (await adminUtil()).getDashboardStats(db),
        })
        registerEndpoint('/api/admin/parties', { method: 'GET', handler: async () => ({ parties: await listParties(db) }) })
        wrapper = await mountAdminPage('index')
        await wrapper.find('select[name="filter"]').setValue('outstanding')
        await flush()
      })
      s.Then('only parties without a submitted RSVP are listed, with phone numbers and copyable RSVP links', () => {
        const list = wrapper.find('[data-testid="party-list"]')
        expect(list.text()).toContain('The Ghosts')
        expect(list.text()).not.toContain('The Fulls')
        expect(list.text()).toContain('+447911123456')
        expect(list.html()).toContain(`?t=${ghostToken}`)
      })
    })
  })

  f.Rule('Party and guest CRUD', (r) => {
    r.RuleScenario('Manual party creation', (s) => {
      let db: Db
      let created: { id: number, token: string }
      s.Given('the admin party form', async () => {
        db = await freshDb()
        // the form page exists and mounts
        const name = 'new'
        expect((await import(`../../app/pages/admin/parties/${name}.vue`)).default).toBeTruthy()
      })
      s.When('the admin creates a party with guests', async () => {
        const { createParty } = await import('../../server/utils/parties')
        created = await createParty(db, {
          name: 'The Newlys',
          guests: [{ name: 'Nora Newly', phone: '07911 123456' }, { name: 'Kid Newly', isChild: true }],
        })
      })
      s.Then('the party receives a token and appears in the list ready for RSVP', async () => {
        expect(created.token).toBeTruthy()
        const list = await listParties(db)
        const entry = list.find((party: { id: number }) => party.id === created.id)
        expect(entry).toBeTruthy()
        expect(entry!.name).toBe('The Newlys')
        expect(entry!.respondedAt).toBeNull()
        expect(entry!.guests.map((guest: { name: string }) => guest.name)).toEqual(['Nora Newly', 'Kid Newly'])
        expect(entry!.guests[1]!.isChild).toBe(true)
        // phone normalised to E.164 at the trust boundary
        expect(entry!.phone).toBe('+447911123456')
      })
    })

    r.RuleScenario('Token regeneration', (s) => {
      let db: Db
      let oldToken = ''
      let partyId = 0
      let newToken = ''
      s.Given('an existing party with a token', async () => {
        db = await freshDb()
        const party = await seedParty(db, 'The Rotators', [{ name: 'Rex Rotator' }], false)
        oldToken = party.token
        partyId = party.id
      })
      s.When('the admin regenerates the token', async () => {
        const { regeneratePartyToken } = await adminUtil()
        newToken = (await regeneratePartyToken(db, partyId)).token
      })
      s.Then('the old token stops working and a new RSVP link is available', async () => {
        const { parties } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        expect(newToken).toBeTruthy()
        expect(newToken).not.toBe(oldToken)
        expect(await db.query.parties.findFirst({ where: eq(parties.token, oldToken) })).toBeUndefined()
        const fresh = await db.query.parties.findFirst({ where: eq(parties.id, partyId) })
        expect(fresh!.token).toBe(newToken)
      })
    })
  })

  f.Rule('Admin can edit RSVP answers', (r) => {
    r.RuleScenario('Meal correction after deadline', (s) => {
      let db: Db
      let partyId = 0
      let guestId = 0
      s.Given('a guest with a submitted course choice and a passed RSVP deadline', async () => {
        db = await freshDb()
        const { settings } = await import('../../server/db/schema')
        await db.insert(settings).values({ key: 'rsvp_deadline', value: '2020-01-01T00:00:00Z' })
        const party = await seedParty(db, 'The Fixers', [
          { name: 'Fay Fixer', phone: '+447911123456', attending: true, ...fullChoices() },
        ], true)
        partyId = party.id
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        guestId = (await db.query.guests.findMany({ where: eq(guests.partyId, partyId) }))[0]!.id
      })
      s.When(`the admin changes one of the guest's course choices`, async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        const result = await saveRsvp(db, partyId, {
          phone: '+447911123456',
          guests: [{ id: guestId, attending: true, ...fullChoices(), mainChoiceId: courseOptions('main')[1]!.id }],
        }, { admin: true })
        expect(result).toEqual({ ok: true })
      })
      s.Then('the change is saved and reflected in dashboard totals and exports', async () => {
        const { guests, parties } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const [stored] = await db.select().from(guests).where(eq(guests.id, guestId))
        expect(stored!.mainChoiceId).toBe(courseOptions('main')[1]!.id)
        // untouched courses keep their choices
        expect(stored!.starterChoiceId).toBe(courseOptions('starter')[0]!.id)
        const party = await db.query.parties.findFirst({ where: eq(parties.id, partyId) })
        expect(party!.updatedAt).toBeTruthy()
        const { getDashboardStats } = await adminUtil()
        const stats = await getDashboardStats(db)
        const main = stats.mealTotals.find((course: { id: string }) => course.id === 'main')!
        const counts = Object.fromEntries(main.options.map((option: { id: string, count: number }) => [option.id, option.count]))
        expect(counts[courseOptions('main')[1]!.id]).toBe(1)
        expect(counts[courseOptions('main')[0]!.id] ?? 0).toBe(0)
      })
    })
  })

  f.Rule('CSV guest list import', (r) => {
    r.RuleScenario('Successful import', (s) => {
      let db: Db
      let csv = ''
      let committed: Record<string, unknown> | null = null
      let wrapper: Wrapper
      s.Given('a CSV with party and guest columns', async () => {
        db = await freshDb()
        csv = [
          'party,guest,phone,child',
          'The Imports,Ivy Import,07911 123456,',
          'The Imports,Iggy Import,,yes',
          'The Solos,Sol Solo,+447911123456,',
        ].join('\n')
      })
      s.When('the admin uploads it and confirms the preview', async () => {
        // UI: paste → preview → confirm
        registerEndpoint('/api/admin/import', {
          method: 'POST',
          handler: async (event) => {
            const body = await readBody(event)
            if (body.commit) {
              committed = body
              return { ok: true, created: 2 }
            }
            const { parseGuestCsv } = await adminImport()
            return { rows: parseGuestCsv(body.csv, []) }
          },
        })
        wrapper = await mountAdminPage('import')
        await wrapper.find('textarea[name="csv"]').setValue(csv)
        await wrapper.find('form').trigger('submit')
        await vi.waitUntil(() => wrapper.find('button[data-testid="confirm-import"]').exists(), { timeout: 3000 })
        await wrapper.find('button[data-testid="confirm-import"]').trigger('click')
        await vi.waitUntil(() => committed !== null, { timeout: 3000 })
        expect(committed).toMatchObject({ commit: true })
        // server: commit writes to the database
        const { importGuestCsv } = await adminImport()
        const result = await importGuestCsv(db, csv)
        expect(result).toMatchObject({ ok: true })
      })
      s.Then('parties and guests are created with tokens and appear in the list', async () => {
        const list = await listParties(db)
        const imports = list.find((party: { name: string }) => party.name === 'The Imports')
        const solos = list.find((party: { name: string }) => party.name === 'The Solos')
        expect(imports).toBeTruthy()
        expect(solos).toBeTruthy()
        expect(imports!.token).toBeTruthy()
        expect(solos!.token).toBeTruthy()
        expect(imports!.guests.map((guest: { name: string }) => guest.name)).toEqual(['Ivy Import', 'Iggy Import'])
        expect(imports!.guests[1]!.isChild).toBe(true)
        expect(imports!.phone).toBe('+447911123456')
        expect(imports!.respondedAt).toBeNull()
      })
    })

    r.RuleScenario('Invalid rows surfaced', (s) => {
      let db: Db
      let csv = ''
      let rows: { line: number, errors: string[] }[] = []
      s.Given('a CSV containing invalid rows such as malformed phones', async () => {
        db = await freshDb()
        const { createParty } = await import('../../server/utils/parties')
        await createParty(db, { name: 'The Existings', guests: [{ name: 'Eve Existing' }] })
        csv = [
          'party,guest,phone,child',
          'The Bads,Bad Phone,12345,',
          ',Nameless Party,,',
          'The Existings,Eve Again,,',
          'The Fines,Fiona Fine,,',
        ].join('\n')
      })
      s.When('the preview is generated', async () => {
        const { parseGuestCsv } = await adminImport()
        const existing = (await listParties(db)).map((party: { name: string }) => party.name)
        rows = parseGuestCsv(csv, existing)
      })
      s.Then('invalid rows are marked with errors and are not imported until corrected', async () => {
        expect(rows).toHaveLength(4)
        expect(rows[0]!.errors.join(' ')).toMatch(/phone/i)
        expect(rows[1]!.errors.length).toBeGreaterThan(0)
        // add-only import: existing party names are rejected, not merged
        expect(rows[2]!.errors.join(' ')).toMatch(/exists/i)
        expect(rows[3]!.errors).toEqual([])
        const { importGuestCsv } = await adminImport()
        const result = await importGuestCsv(db, csv)
        expect(result.ok).toBe(false)
        const list = await listParties(db)
        expect(list.map((party: { name: string }) => party.name)).toEqual(['The Existings'])
      })
    })
  })

  f.Rule('Wedding date and deadline editable in admin UI', (r) => {
    r.RuleScenario('Deadline moved', (s) => {
      let db: Db
      let saved: Record<string, unknown> | null = null
      let wrapper: Wrapper
      s.Given('the admin settings page', async () => {
        db = await freshDb()
        registerEndpoint('/api/admin/settings', {
          method: 'GET',
          handler: () => ({ weddingDate: '2027-01-17', rsvpDeadline: '2100-01-01T00:00:00Z' }),
        })
        registerEndpoint('/api/admin/settings', {
          method: 'PUT',
          handler: async (event) => {
            saved = await readBody(event)
            return { ok: true }
          },
        })
        wrapper = await mountAdminPage('settings')
      })
      s.When('the admin changes the RSVP deadline', async () => {
        // UI saves the new deadline
        await wrapper.find('input[name="rsvpDeadline"]').setValue('2020-01-01')
        await wrapper.find('form').trigger('submit')
        await flush()
        expect(saved).toMatchObject({ rsvpDeadline: expect.stringContaining('2020-01-01') })
        // server persists it
        const { saveSettings } = await adminUtil()
        await saveSettings(db, { rsvpDeadline: '2020-01-01T00:00:00Z' })
      })
      s.Then(`the RSVP form's lock behaviour follows the new deadline immediately`, async () => {
        const { getDeadline, saveRsvp } = await import('../../server/utils/rsvp')
        expect(await getDeadline(db)).toBe('2020-01-01T00:00:00Z')
        const party = await seedParty(db, 'The Lates', [{ name: 'Lars Late' }], false)
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const guestId = (await db.query.guests.findMany({ where: eq(guests.partyId, party.id) }))[0]!.id
        const result = await saveRsvp(db, party.id, { phone: '+447911123456', guests: [{ id: guestId, attending: false }] })
        expect(result.ok).toBe(false)
        // moving it forward unlocks again
        const { saveSettings } = await adminUtil()
        await saveSettings(db, { rsvpDeadline: '2100-01-01T00:00:00Z' })
        const retry = await saveRsvp(db, party.id, { phone: '+447911123456', guests: [{ id: guestId, attending: false }] })
        expect(retry.ok).toBe(true)
      })
    })
  })
})
