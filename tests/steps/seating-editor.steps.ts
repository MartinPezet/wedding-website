// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { readBody } from 'h3'
import { clearNuxtData } from '#imports'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/seating-editor.feature')

// variable path so a missing module fails scenarios, not the whole file
const seatingUtil = async () => await import(`../../server/utils/${'seating'}.ts`)
const seatingShared = async () => await import(`../../shared/utils/${'seating'}.ts`)

type Db = Awaited<ReturnType<typeof freshDb>>

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

const mountSeatingPage = async () => {
  clearNuxtData()
  const page = (await import(`../../app/pages/admin/${'seating'}.vue`)).default
  return mountSuspended(page)
}

/** wire GET/PATCH/POST seating endpoints to a real in-memory db */
const registerSeatingApi = async (db: Db) => {
  const { getSeatingData, applySeatingPatch, createTable } = await seatingUtil()
  registerEndpoint('/api/admin/seating', { method: 'GET', handler: () => getSeatingData(db) })
  registerEndpoint('/api/admin/seating', {
    method: 'PATCH',
    handler: async event => applySeatingPatch(db, await readBody(event)),
  })
  registerEndpoint('/api/admin/seating/tables', {
    method: 'POST',
    handler: async event => createTable(db, await readBody(event)),
  })
}

const seedAttendingGuest = async (db: Db, partyName: string, guestName: string) => {
  const { createParty } = await import('../../server/utils/parties')
  const { guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const party = await createParty(db, { name: partyName, guests: [{ name: guestName }] })
  await db.update(guests).set({ attending: true }).where(eq(guests.partyId, party.id))
  const [guest] = await db.query.guests.findMany({ where: eq(guests.partyId, party.id) })
  return guest!
}

describeFeature(feature, (f) => {
  f.Rule('Table layout editing', (r) => {
    r.RuleScenario('Table created and placed', (s) => {
      let db: Db
      let tableId = 0
      s.Given('the seating canvas', async () => {
        db = await freshDb()
      })
      s.When('the admin adds a round table with capacity 10 and drags it into position', async () => {
        const { createTable, applySeatingPatch } = await seatingUtil()
        const table = await createTable(db, { name: 'Top Table', shape: 'round', capacity: 10 })
        tableId = table.id
        await applySeatingPatch(db, { tables: [{ id: tableId, x: 420, y: 260 }] })
      })
      s.Then('the table renders at that position with 10 seat positions and persists across reloads', async () => {
        const { getSeatingData } = await seatingUtil()
        const { seatPositions } = await seatingShared()
        // fresh read = reload
        const { tables } = await getSeatingData(db)
        const table = tables.find((t: { id: number }) => t.id === tableId)
        expect(table).toMatchObject({ name: 'Top Table', shape: 'round', capacity: 10, x: 420, y: 260 })
        expect(seatPositions(table!.shape, table!.capacity)).toHaveLength(10)
      })
    })
  })

  f.Rule('Guest seat assignment by drag and drop', (r) => {
    r.RuleScenario('Guest seated', (s) => {
      let db: Db
      let guestId = 0
      let tableId = 0
      s.Given('an attending guest in the sidebar', async () => {
        db = await freshDb()
        const guest = await seedAttendingGuest(db, 'The Seateds', 'Sam Seated')
        guestId = guest.id
        const { createTable, getSeatingData } = await seatingUtil()
        tableId = (await createTable(db, { name: 'Table 1', shape: 'round', capacity: 8 })).id
        const { guests } = await getSeatingData(db)
        expect(guests.find((g: { id: number }) => g.id === guestId)).toMatchObject({ attending: true, tableId: null })
      })
      s.When('the admin drags the guest onto an empty seat', async () => {
        const { applySeatingPatch } = await seatingUtil()
        await applySeatingPatch(db, { assignments: [{ guestId, tableId, seatIndex: 2 }] })
      })
      s.Then('the guest occupies that seat, appears on the table, and the assignment persists', async () => {
        const { getSeatingData } = await seatingUtil()
        const { guests } = await getSeatingData(db)
        expect(guests.find((g: { id: number }) => g.id === guestId)).toMatchObject({ tableId, seatIndex: 2 })
      })
    })

    r.RuleScenario('Guest moved', (s) => {
      let db: Db
      let guestId = 0
      let firstTableId = 0
      let secondTableId = 0
      s.Given('an already-seated guest', async () => {
        db = await freshDb()
        const guest = await seedAttendingGuest(db, 'The Movers', 'Mo Mover')
        guestId = guest.id
        const { createTable, applySeatingPatch } = await seatingUtil()
        firstTableId = (await createTable(db, { name: 'Table 1', shape: 'round', capacity: 8 })).id
        secondTableId = (await createTable(db, { name: 'Table 2', shape: 'rect', capacity: 6 })).id
        await applySeatingPatch(db, { assignments: [{ guestId, tableId: firstTableId, seatIndex: 0 }] })
      })
      s.When('the admin drags them to a different seat or table', async () => {
        const { applySeatingPatch } = await seatingUtil()
        await applySeatingPatch(db, { assignments: [{ guestId, tableId: secondTableId, seatIndex: 3 }] })
      })
      s.Then('the assignment updates and the previous seat becomes free', async () => {
        const { getSeatingData } = await seatingUtil()
        const { guests } = await getSeatingData(db)
        expect(guests.find((g: { id: number }) => g.id === guestId)).toMatchObject({ tableId: secondTableId, seatIndex: 3 })
        expect(guests.some((g: { tableId: number | null, seatIndex: number | null }) =>
          g.tableId === firstTableId && g.seatIndex === 0)).toBe(false)
      })
    })
  })

  f.Rule('Seating validation warnings', (r) => {
    r.RuleScenario('Unseated guests flagged', (s) => {
      let db: Db
      let wrapper: Awaited<ReturnType<typeof mountSeatingPage>>
      s.Given('attending guests not assigned to any seat', async () => {
        db = await freshDb()
        await seedAttendingGuest(db, 'The Standings', 'Stan Standing')
        await seedAttendingGuest(db, 'The Standings Too', 'Stella Standing')
        const { createTable } = await seatingUtil()
        await createTable(db, { name: 'Table 1', shape: 'round', capacity: 8 })
      })
      s.When('the editor renders', async () => {
        await registerSeatingApi(db)
        wrapper = await mountSeatingPage()
      })
      s.Then('it shows a count or list of unseated guests', () => {
        const warnings = wrapper.find('[data-testid="seating-warnings"]')
        expect(warnings.exists()).toBe(true)
        expect(warnings.text()).toContain('2')
        expect(wrapper.find('[data-testid="unassigned-count"]').text()).toContain('2')
      })
    })

    r.RuleScenario('Seated guest declines', (s) => {
      let db: Db
      let guestId = 0
      let wrapper: Awaited<ReturnType<typeof mountSeatingPage>>
      s.Given('a seated guest whose RSVP changes to not attending', async () => {
        db = await freshDb()
        const guest = await seedAttendingGuest(db, 'The Changers', 'Cara Changer')
        guestId = guest.id
        const { createTable, applySeatingPatch } = await seatingUtil()
        const table = await createTable(db, { name: 'Table 1', shape: 'round', capacity: 8 })
        await applySeatingPatch(db, { assignments: [{ guestId, tableId: table.id, seatIndex: 0 }] })
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        await db.update(guests).set({ attending: false }).where(eq(guests.id, guestId))
      })
      s.When('the editor renders', async () => {
        await registerSeatingApi(db)
        wrapper = await mountSeatingPage()
      })
      s.Then('it flags the stale assignment and offers one-click removal', async () => {
        const warnings = wrapper.find('[data-testid="seating-warnings"]')
        expect(warnings.exists()).toBe(true)
        expect(warnings.text()).toContain('Cara Changer')
        await wrapper.find(`[data-testid="remove-orphan-${guestId}"]`).trigger('click')
        // removal autosaves through to the database
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        await vi.waitUntil(async () =>
          (await db.query.guests.findFirst({ where: eq(guests.id, guestId) }))!.tableId === null, { timeout: 3000 })
      })
    })
  })

  f.Rule('Layout persists and survives reloads', (r) => {
    r.RuleScenario('Autosave', (s) => {
      let db: Db
      let guestId = 0
      let tableId = 0
      let reopened: Awaited<ReturnType<Awaited<ReturnType<typeof import('../../app/composables/useSeatingEditor')>>['useSeatingEditor']>>
      s.Given('seating edits made by the admin', async () => {
        db = await freshDb()
        const guest = await seedAttendingGuest(db, 'The Savers', 'Sal Saver')
        guestId = guest.id
        await registerSeatingApi(db)
        const { useSeatingEditor } = await import(`../../app/composables/${'useSeatingEditor'}.ts`)
        const editor = useSeatingEditor({ autosaveDelay: 10 })
        await editor.load()
        const table = await editor.addTable('round')
        tableId = table.id
        editor.moveTable(tableId, 321, 234)
        editor.assignGuest(guestId, tableId, 5)
        // debounced autosave lands without any explicit save action
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        await vi.waitUntil(async () =>
          (await db.query.guests.findFirst({ where: eq(guests.id, guestId) }))!.tableId === tableId, { timeout: 3000 })
      })
      s.When('the editor is reopened later', async () => {
        const { useSeatingEditor } = await import(`../../app/composables/${'useSeatingEditor'}.ts`)
        reopened = useSeatingEditor()
        await reopened.load()
      })
      s.Then('the layout and assignments match the last edits with no explicit save action', () => {
        const table = reopened.tables.value.find(t => t.id === tableId)!
        expect(table).toMatchObject({ x: 321, y: 234, shape: 'round' })
        const guest = reopened.guests.value.find(g => g.id === guestId)!
        expect(guest).toMatchObject({ tableId, seatIndex: 5 })
      })
    })
  })
})
