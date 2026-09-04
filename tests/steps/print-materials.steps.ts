// @vitest-environment nuxt
import { readFileSync } from 'node:fs'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
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

// mountSuspended's route option doesn't reach useRoute() here, so query params
// are injected via a hoisted mutable (see rsvp test conventions)
const routeState = vi.hoisted(() => ({ query: {} as Record<string, string> }))
mockNuxtImport('useRoute', () => () => ({ query: routeState.query }))

const authMiddleware = async () =>
  (await import('../../app/middleware/auth.global')).default as unknown as (to: { path: string }) => unknown

// shared letters fixtures; three parties exercise the odd (half-empty) sheet
const letterParties = [
  { id: 1, name: 'The Smiths', token: 'tok-smith-abc' },
  { id: 2, name: 'The Patels', token: 'tok-patel-xyz' },
  { id: 3, name: 'Alex Jones', token: 'tok-jones-123' },
]
const registerParties = () =>
  registerEndpoint('/api/admin/parties', { method: 'GET', handler: () => ({ parties: letterParties }) })

/** mount the letters print page with query params (sheet / party) applied */
const mountLetters = async (query: Record<string, string> = {}) => {
  clearNuxtData()
  routeState.query = query
  return await mountSuspended(await printPage('letters'))
}
type LettersWrapper = Awaited<ReturnType<typeof mountLetters>>
const sheetsOf = (wrapper: LettersWrapper) => wrapper.findAll('[data-print-page]')

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
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders', async () => {
        wrapper = await mountLetters()
      })
      s.Then('it contains one sheet per two parties and no other pages, with one A6 letter per party, each with that party\'s own QR code and fallback URL', () => {
        expect(sheetsOf(wrapper)).toHaveLength(Math.ceil(letterParties.length / 2))
        const letters = wrapper.findAll('[data-letter]')
        expect(letters).toHaveLength(letterParties.length)
        letters.forEach((letter, index) => {
          const party = letterParties[index]!
          expect(letter.text()).toContain(party.name)
          // QR rendered as inline SVG
          expect(letter.find('[data-qr] svg').exists()).toBe(true)
          // fallback URL carries this party's own token
          expect(letter.find('[data-fallback]').text()).toContain(`?t=${party.token}`)
        })
      })
    })

    r.RuleScenario('Two letters per A5 sheet', (s) => {
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders with no sheet selected', async () => {
        wrapper = await mountLetters()
      })
      s.Then('every sheet is A5, holds at most two letters with a cut guide between the halves, carries no crop marks, and no sheet is a back page', () => {
        const sheets = sheetsOf(wrapper)
        expect(sheets.length).toBeGreaterThan(0)
        for (const sheet of sheets) {
          expect(sheet.classes()).toContain('print-page-a5')
          expect(sheet.findAll('[data-letter]').length).toBeLessThanOrEqual(2)
          expect(sheet.find('[data-cut]').exists()).toBe(true)
        }
        expect(wrapper.find('[data-crop]').exists()).toBe(false)
        expect(wrapper.find('[data-letter-back]').exists()).toBe(false)
      })
    })

    r.RuleScenario('Two letters per A4 sheet with crop marks', (s) => {
      let wrapper: LettersWrapper
      let a5Letters: string[] = []
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders with the A4 sheet selected', async () => {
        // render the default stock first, so the letters can be compared
        a5Letters = (await mountLetters()).findAll('[data-letter]').map(letter => letter.element.innerHTML)
        wrapper = await mountLetters({ sheet: 'a4' })
      })
      s.Then('every sheet is A4, holds at most two letters, carries crop marks, and the letters are unchanged from the A5 layout', () => {
        const sheets = sheetsOf(wrapper)
        expect(sheets.length).toBeGreaterThan(0)
        for (const sheet of sheets) {
          expect(sheet.classes()).toContain('print-page-a4')
          expect(sheet.findAll('[data-letter]').length).toBeLessThanOrEqual(2)
          expect(sheet.find('[data-crop]').exists()).toBe(true)
        }
        expect(wrapper.findAll('[data-letter]').map(letter => letter.element.innerHTML)).toEqual(a5Letters)
      })
    })

    r.RuleScenario('Sheet toggle is screen-only', (s) => {
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders', async () => {
        wrapper = await mountLetters()
      })
      s.Then('it shows an A5 / A4 sheet toggle inside a no-print element', () => {
        const toggle = wrapper.find('[data-sheet-toggle]')
        expect(toggle.exists()).toBe(true)
        expect(toggle.findAll('button').map(button => button.text())).toEqual(['A5', 'A4'])
        expect(toggle.element.closest('.no-print')).not.toBeNull()
      })
    })

    r.RuleScenario('Single-party reprint', (s) => {
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters view renders for a single party via the party query parameter', async () => {
        wrapper = await mountLetters({ party: '1' })
      })
      s.Then('exactly one sheet renders, holding that party\'s letter only', () => {
        expect(sheetsOf(wrapper)).toHaveLength(1)
        const letters = wrapper.findAll('[data-letter]')
        expect(letters).toHaveLength(1)
        expect(letters[0]!.text()).toContain(letterParties[0]!.name)
      })
    })

    r.RuleScenario('Names match the site header style', (s) => {
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders', async () => {
        wrapper = await mountLetters()
      })
      s.Then('each letter\'s names heading is light italic display type with a petal-coloured ampersand, and a centred header divider immediately follows it', () => {
        const letters = wrapper.findAll('[data-letter]')
        expect(letters.length).toBeGreaterThan(0)
        for (const letter of letters) {
          const heading = letter.find('h1')
          expect(heading.classes()).toEqual(expect.arrayContaining(['font-display', 'font-light', 'italic']))
          expect(heading.find('span.text-petal').text()).toBe('&')
          const divider = heading.element.nextElementSibling
          expect(divider?.hasAttribute('data-letter-header-divider')).toBe(true)
          expect(divider?.classList.contains('mx-auto')).toBe(true)
        }
      })
    })

    r.RuleScenario('QR code matches letter styling', (s) => {
      let svg = ''
      s.Given('an invite letter for a party', () => {})
      s.When('its QR code markup is generated', async () => {
        const { qrSvg } = await import('#shared/utils/qr')
        svg = await qrSvg('https://example.test/?t=abc123')
      })
      s.Then('the background is transparent, the dark modules use the petal-deep colour, the data modules are rounded, and the three finder-pattern squares stay sharp-cornered', () => {
        // no legacy opaque background rect (old renderer's full-canvas path)
        expect(svg).not.toMatch(/H\d+(?:\.\d+)?z/)
        expect(svg).toContain('#4c66ac')
        const finderGroup = svg.match(/<g data-qr-finder[^>]*>[\s\S]*?<\/g>/)?.[0] ?? ''
        const dataGroup = svg.match(/<g data-qr-data[^>]*>[\s\S]*?<\/g>/)?.[0] ?? ''
        expect(finderGroup).not.toContain('rx=')
        expect(dataGroup).toMatch(/rx="0\.\d+"/)
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
        handout = (await import('#shared/content')).handout
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

  f.Rule('Tulip corner art on letters and handout', (r) => {
    // source-level: the corner art components are placed in each template
    r.RuleScenario('Letters carry tulip corners', (s) => {
      let src = ''
      s.Given('the RSVP letters print page', () => {
        src = readFileSync('app/pages/admin/print/letters.vue', 'utf8')
      })
      s.When('its markup is inspected', () => {})
      s.Then('each letter places the tulip corner art bottom-right and a hydrangea cluster top-left', () => {
        expect(src).toContain('FloralTulipCorner')
        expect(src).toContain('FloralCluster')
      })
    })

    r.RuleScenario('Handout carries tulip corners', (s) => {
      let src = ''
      s.Given('the day handout print page', () => {
        src = readFileSync('app/pages/admin/print/handout.vue', 'utf8')
      })
      s.When('its markup is inspected', () => {})
      s.Then('the tulip corner art is placed on the handout page', () => {
        expect(src).toContain('FloralTulipCorner')
      })
    })
  })

  f.Rule('Bottom divider on invite letters', (r) => {
    r.RuleScenario('Letter shows a closing divider', (s) => {
      let wrapper: LettersWrapper
      s.Given('multiple parties with tokens', () => {
        registerParties()
      })
      s.When('the letters batch view renders', async () => {
        wrapper = await mountLetters()
      })
      s.Then('each letter contains a centered divider at its bottom, below the column content', () => {
        const letters = wrapper.findAll('[data-letter]')
        expect(letters.length).toBeGreaterThan(0)
        for (const letter of letters) {
          expect(letter.find('[data-letter-divider]').exists()).toBe(true)
        }
      })
    })
  })
})
