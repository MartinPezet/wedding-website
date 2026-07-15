// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/print-materials.feature')

// dynamic path so a missing page fails only its own scenario, not the file
const printPage = async (name: string) =>
  (await import(`../../app/pages/admin/print/${name}.vue`)).default

type Db = Awaited<ReturnType<typeof freshDb>>

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

const registerSeatingGet = async (db: Db) => {
  const { getSeatingData } = await import('../../server/utils/seating')
  registerEndpoint('/api/admin/seating', { method: 'GET', handler: () => getSeatingData(db) })
}

/** seat an attending guest with a main-course choice at a table + seat */
const seatGuest = async (
  db: Db,
  opts: { party: string, guest: string, tableId: number, seatIndex: number, mainChoiceId?: string },
) => {
  const { createParty } = await import('../../server/utils/parties')
  const { applySeatingPatch } = await import('../../server/utils/seating')
  const { guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const party = await createParty(db, { name: opts.party, guests: [{ name: opts.guest }] })
  await db.update(guests)
    .set({ attending: true, mainChoiceId: opts.mainChoiceId ?? null })
    .where(eq(guests.partyId, party.id))
  const [row] = await db.query.guests.findMany({ where: eq(guests.partyId, party.id) })
  await applySeatingPatch(db, { assignments: [{ guestId: row!.id, tableId: opts.tableId, seatIndex: opts.seatIndex }] })
  return row!
}

// real useUserSession returns an empty (unauthenticated) session in tests;
// only navigateTo needs stubbing so the redirect target is returned inline
mockNuxtImport('navigateTo', () => (to: string) => to)

const authMiddleware = async () =>
  (await import('../../app/middleware/auth.global')).default as unknown as (to: { path: string }) => unknown

describeFeature(feature, (f) => {
  // "Shared print layer in site style" is @manual (print fidelity) — skipped

  f.Rule('Print routes are admin-only', (r) => {
    r.RuleScenario('Unauthenticated access blocked', (s) => {
      let result: unknown
      s.Given('no admin session', () => {
        // real session state is already empty/unauthenticated
      })
      s.When('a print route is requested', async () => {
        result = (await authMiddleware())({ path: '/admin/print/letters' })
      })
      s.Then('access is denied', () => {
        expect(result).toBe('/admin/login')
      })
    })
  })

  f.Rule('RSVP letters with personal QR codes', (r) => {
    r.RuleScenario('Batch letter printing', (s) => {
      const parties = [
        { id: 1, name: 'The Smiths', token: 'tok-smith-abc' },
        { id: 2, name: 'The Patels', token: 'tok-patel-xyz' },
        { id: 3, name: 'Alex Jones', token: 'tok-jones-123' },
      ]
      let wrapper: Awaited<ReturnType<typeof mountSuspended>>
      s.Given('multiple parties with tokens', () => {
        registerEndpoint('/api/admin/parties', { method: 'GET', handler: () => ({ parties }) })
      })
      s.When('the letters batch view renders', async () => {
        clearNuxtData()
        wrapper = await mountSuspended(await printPage('letters'))
      })
      s.Then('it contains one A5 letter per party, each with that party\'s own QR code and fallback URL', () => {
        const letters = wrapper.findAll('[data-letter]')
        expect(letters).toHaveLength(parties.length)
        letters.forEach((letter, index) => {
          const party = parties[index]!
          expect(letter.text()).toContain(party.name)
          // QR rendered as inline SVG
          expect(letter.find('[data-qr] svg').exists()).toBe(true)
          // fallback URL carries this party's own token
          const fallback = letter.find('[data-fallback]').text()
          expect(fallback).toContain(`?t=${party.token}`)
        })
      })
    })
  })

  f.Rule('Large-format seating chart print', (r) => {
    r.RuleScenario('Chart lists each table\'s guests', (s) => {
      let db: Db
      let wrapper: Awaited<ReturnType<typeof mountSuspended>>
      s.Given('a persisted seating layout', async () => {
        db = await freshDb()
        const { createTable } = await import('../../server/utils/seating')
        const top = await createTable(db, { name: 'Top Table', shape: 'round', capacity: 8 })
        const two = await createTable(db, { name: 'Table Two', shape: 'rect', capacity: 6 })
        // two guests on the top table (out of seat order), one on table two
        await seatGuest(db, { party: 'The Apples', guest: 'Anna Apple', tableId: top.id, seatIndex: 2 })
        await seatGuest(db, { party: 'The Ashes', guest: 'Amy Ash', tableId: top.id, seatIndex: 0 })
        await seatGuest(db, { party: 'The Berries', guest: 'Bob Berry', tableId: two.id, seatIndex: 1 })
      })
      s.When('the admin renders the seating chart print view', async () => {
        clearNuxtData()
        await registerSeatingGet(db)
        wrapper = await mountSuspended(await printPage('seating'))
      })
      s.Then('each table is listed with its seated guests, matching the editor\'s assignments', () => {
        const blocks = wrapper.findAll('[data-chart-table]')
        expect(blocks.map(block => block.attributes('data-chart-table'))).toEqual(['Top Table', 'Table Two'])
        // top table lists both its guests, ordered by seat index (Amy seat 0, Anna seat 2)
        const topGuests = blocks[0]!.findAll('[data-chart-guest]').map(guest => guest.text())
        expect(topGuests).toEqual(['Amy Ash', 'Anna Apple'])
        // table two lists only its own guest
        expect(blocks[1]!.findAll('[data-chart-guest]').map(guest => guest.text())).toEqual(['Bob Berry'])
      })
    })
  })

  f.Rule('Place cards', (r) => {
    r.RuleScenario('Place card sheet', (s) => {
      let db: Db
      let wrapper: Awaited<ReturnType<typeof mountSuspended>>
      s.Given('seated attending guests', async () => {
        db = await freshDb()
        const { createTable } = await import('../../server/utils/seating')
        const a = await createTable(db, { name: 'Table A', shape: 'round', capacity: 8 })
        const b = await createTable(db, { name: 'Table B', shape: 'rect', capacity: 6 })
        // deliberately seed out of final order; the view must sort by table then seat
        await seatGuest(db, { party: 'P2', guest: 'Bob Berry', tableId: b.id, seatIndex: 0, mainChoiceId: 'veggie' })
        await seatGuest(db, { party: 'P1', guest: 'Cara Cherry', tableId: a.id, seatIndex: 1, mainChoiceId: 'fish' })
        await seatGuest(db, { party: 'P0', guest: 'Anna Apple', tableId: a.id, seatIndex: 0, mainChoiceId: 'beef' })
      })
      s.When('the admin renders place cards', async () => {
        clearNuxtData()
        await registerSeatingGet(db)
        wrapper = await mountSuspended(await printPage('place-cards'))
      })
      s.Then('each guest has a card with name and meal marker, in table and seat order, with fold and crop guides', () => {
        const cards = wrapper.findAll('[data-place-card]')
        expect(cards).toHaveLength(3)
        // order: Table A seat 0, Table A seat 1, Table B seat 0
        expect(cards.map(card => card.attributes('data-place-card'))).toEqual(['Anna Apple', 'Cara Cherry', 'Bob Berry'])
        expect(cards[0]!.text()).toContain('Anna Apple')
        expect(cards[0]!.text()).toContain('Roast Beef')
        expect(cards[1]!.text()).toContain('Pan-Seared Salmon')
        expect(cards[2]!.text()).toContain('Wild Mushroom Wellington')
        // fold and crop guides present
        expect(wrapper.find('[data-fold]').exists()).toBe(true)
        expect(wrapper.find('[data-crop]').exists()).toBe(true)
      })
    })
  })

  f.Rule('Day handouts from JSON', (r) => {
    r.RuleScenario('Handout content update', (s) => {
      let wrapper: Awaited<ReturnType<typeof mountSuspended>>
      let handout: { sections: { title: string, items: string[] }[] }
      s.Given('edited handout.json content', async () => {
        handout = (await import('../../shared/content')).handout
        expect(handout.sections.length).toBeGreaterThan(0)
      })
      s.When('the site is rebuilt', async () => {
        clearNuxtData()
        wrapper = await mountSuspended(await printPage('handout'))
      })
      s.Then('the printed handout reflects the new content with no component changes', () => {
        // one rendered section per JSON entry proves the page is data-driven
        expect(wrapper.findAll('[data-handout-section]')).toHaveLength(handout.sections.length)
        for (const section of handout.sections) {
          expect(wrapper.text()).toContain(section.title)
          for (const item of section.items) expect(wrapper.text()).toContain(item)
        }
      })
    })
  })
})
