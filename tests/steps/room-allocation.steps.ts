// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'
import type { RoomChoice, RoomNight } from '#shared/content'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/room-allocation.feature')

// variable path so a missing module fails scenarios, not the whole file
const allocationUtil = async () => await import(`../../server/utils/${'allocation'}.ts`)

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

type Db = Awaited<ReturnType<typeof freshDb>>

interface SeedRoom {
  night: RoomNight
  choice: RoomChoice
  shareWith?: string
  occupants?: number
}

/** a party whose guests are all attending, with its room requests; returns the stored request ids */
const seedParty = async (db: Db, name: string, guestNames: string[], rooms: SeedRoom[]) => {
  const { createParty } = await import('../../server/utils/parties')
  const { guests, roomRequests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const party = await createParty(db, { name, guests: guestNames.map(guest => ({ name: guest })) })
  await db.update(guests).set({ attending: true }).where(eq(guests.partyId, party.id))
  const stored = await db.insert(roomRequests).values(rooms.map((room, index) => ({
    partyId: party.id,
    night: room.night,
    choice: room.choice,
    shareWith: room.shareWith ?? null,
    occupants: room.occupants ?? 1,
    sortOrder: index,
  }))).returning()
  return stored.map(row => row.id)
}

const partnerOf = async (db: Db, id: number) => {
  const { roomRequests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const [row] = await db.select().from(roomRequests).where(eq(roomRequests.id, id))
  return row!.pairedWithId
}

const awaitingIds = async (db: Db) => {
  const { roomingView } = await allocationUtil()
  return (await roomingView(db))
    .filter((room: { kind: string }) => room.kind === 'awaiting_partner')
    .flatMap((room: { requestIds: number[] }) => room.requestIds)
}

const mountRooms = async (db: Db) => {
  const { roomingView } = await allocationUtil()
  const rooms = await roomingView(db)
  clearNuxtData()
  registerEndpoint('/api/admin/rooms', { method: 'GET', handler: () => ({ rooms }) })
  const name = 'rooms'
  const page = (await import(`../../app/pages/admin/${name}.vue`)).default
  return mountSuspended(page)
}

type Wrapper = Awaited<ReturnType<typeof mountRooms>>

describeFeature(feature, (f) => {
  f.Rule('Admin pairs match-me requests by hand', (r) => {
    r.RuleScenario('Two match-me requests paired', (s) => {
      let db: Db
      let ann = 0
      let ben = 0
      s.Given('two unpaired match-me requests for the same night', async () => {
        db = await freshDb()
        ;[ann] = await seedParty(db, 'The Ables', ['Ann Able'], [{ night: 'of', choice: 'share_match' }])
        ;[ben] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
        expect((await awaitingIds(db)).toSorted()).toEqual([ann, ben].toSorted())
      })
      s.When('the admin pairs them', async () => {
        const { pairRooms } = await allocationUtil()
        expect(await pairRooms(db, ann, ben)).toEqual({ ok: true })
      })
      s.Then('each request records the other as its partner and both leave the unpaired list', async () => {
        expect(await partnerOf(db, ann)).toBe(ben)
        expect(await partnerOf(db, ben)).toBe(ann)
        expect(await awaitingIds(db)).toEqual([])
      })
    })

    r.RuleScenario('Pairing across nights refused', (s) => {
      let db: Db
      let before = 0
      let of = 0
      let result: { ok: boolean }
      s.Given('a night-before match-me request and a night-of match-me request', async () => {
        db = await freshDb()
        ;[before] = await seedParty(db, 'The Ables', ['Ann Able'], [{ night: 'before', choice: 'share_match' }])
        ;[of] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
      })
      s.When('the admin attempts to pair them', async () => {
        const { pairRooms } = await allocationUtil()
        result = await pairRooms(db, before, of)
      })
      s.Then('the pairing is refused and neither request is changed', async () => {
        expect(result.ok).toBe(false)
        expect(await partnerOf(db, before)).toBeNull()
        expect(await partnerOf(db, of)).toBeNull()
      })
    })

    r.RuleScenario('Pairing a non-match-me request refused', (s) => {
      let db: Db
      let own = 0
      let match = 0
      let result: { ok: boolean }
      s.Given(`a request for a room of the party's own`, async () => {
        db = await freshDb()
        ;[own] = await seedParty(db, 'The Ables', ['Ann Able', 'Art Able'], [{ night: 'of', choice: 'our_room', occupants: 2 }])
        ;[match] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
      })
      s.When('the admin attempts to pair it with a match-me request', async () => {
        const { pairRooms } = await allocationUtil()
        result = await pairRooms(db, own, match)
      })
      s.Then('the pairing is refused and neither request is changed', async () => {
        expect(result.ok).toBe(false)
        expect(await partnerOf(db, own)).toBeNull()
        expect(await partnerOf(db, match)).toBeNull()
      })
    })

    r.RuleScenario('Unpairing clears both sides', (s) => {
      let db: Db
      let ann = 0
      let ben = 0
      s.Given('two paired match-me requests', async () => {
        db = await freshDb()
        ;[ann] = await seedParty(db, 'The Ables', ['Ann Able'], [{ night: 'before', choice: 'share_match' }])
        ;[ben] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'before', choice: 'share_match' }])
        const { pairRooms } = await allocationUtil()
        expect(await pairRooms(db, ann, ben)).toEqual({ ok: true })
      })
      s.When('the admin unpairs one of them', async () => {
        const { unpairRooms } = await allocationUtil()
        await unpairRooms(db, ben)
      })
      s.Then('both requests return to the unpaired list with no partner recorded', async () => {
        expect(await partnerOf(db, ann)).toBeNull()
        expect(await partnerOf(db, ben)).toBeNull()
        expect((await awaitingIds(db)).toSorted()).toEqual([ann, ben].toSorted())
      })
    })

    r.RuleScenario('Already-paired request cannot be paired again', (s) => {
      let db: Db
      let ann = 0
      let ben = 0
      let cat = 0
      let result: { ok: boolean }
      s.Given('a match-me request that already has a partner', async () => {
        db = await freshDb()
        ;[ann] = await seedParty(db, 'The Ables', ['Ann Able'], [{ night: 'of', choice: 'share_match' }])
        ;[ben] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
        ;[cat] = await seedParty(db, 'The Carters', ['Cat Carter'], [{ night: 'of', choice: 'share_match' }])
        const { pairRooms } = await allocationUtil()
        expect(await pairRooms(db, ann, ben)).toEqual({ ok: true })
      })
      s.When('the admin attempts to pair it with a third request', async () => {
        const { pairRooms } = await allocationUtil()
        result = await pairRooms(db, ann, cat)
      })
      s.Then('the pairing is refused and the existing pairing is left intact', async () => {
        expect(result.ok).toBe(false)
        expect(await partnerOf(db, ann)).toBe(ben)
        expect(await partnerOf(db, ben)).toBe(ann)
        expect(await partnerOf(db, cat)).toBeNull()
      })
    })
  })

  f.Rule('Combined rooming view across both nights', (r) => {
    r.RuleScenario('Rooming view reflects bookings', (s) => {
      let db: Db
      let ids: number[] = []
      let wrapper: Wrapper
      s.Given('room requests across both nights and several parties', async () => {
        db = await freshDb()
        ids = [
          ...await seedParty(db, 'The Ables', ['Ann Able', 'Art Able'], [
            { night: 'before', choice: 'our_room', occupants: 2 },
            { night: 'of', choice: 'our_room', occupants: 2 },
          ]),
          ...await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }]),
          ...await seedParty(db, 'The Carters', ['Cat Carter'], [{ night: 'before', choice: 'share_named', shareWith: 'Jo Jones' }]),
        ]
      })
      s.When('the admin opens the rooming view', async () => {
        wrapper = await mountRooms(db)
      })
      s.Then('every room request appears under its night with its occupants and party', async () => {
        const { roomingView } = await allocationUtil()
        const rooms = await roomingView(db) as { night: RoomNight, requestIds: number[], occupants: string[], parties: string[] }[]
        expect(rooms.flatMap(room => room.requestIds).toSorted()).toEqual(ids.toSorted())
        expect(rooms.find(room => room.night === 'before' && room.parties.includes('The Ables'))!.occupants)
          .toEqual(['Ann Able', 'Art Able'])

        const before = wrapper.find('[data-night="before"]').text()
        const of = wrapper.find('[data-night="of"]').text()
        expect(before).toContain('The Ables')
        expect(before).toContain('Art Able')
        expect(before).toContain('The Carters')
        expect(before).not.toContain('The Bakers')
        expect(of).toContain('The Ables')
        expect(of).toContain('Ben Baker')
        expect(of).not.toContain('The Carters')
      })
    })

    r.RuleScenario('Unpaired requests surfaced', (s) => {
      let db: Db
      let ben = 0
      let wrapper: Wrapper
      s.Given('a match-me request with no partner', async () => {
        db = await freshDb()
        ;[ben] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
      })
      s.When('the admin opens the rooming view', async () => {
        wrapper = await mountRooms(db)
      })
      s.Then('it is listed as awaiting a partner rather than shown as a complete room', async () => {
        expect(await awaitingIds(db)).toEqual([ben])
        const awaiting = wrapper.find('[data-awaiting-partner]')
        expect(awaiting.exists()).toBe(true)
        expect(awaiting.text()).toContain('Ben Baker')
        expect(wrapper.find('[data-room]').exists()).toBe(false)
      })
    })

    r.RuleScenario('Named share shows the supplied name', (s) => {
      let db: Db
      let wrapper: Wrapper
      s.Given('a party sharing a room with a named person from another party', async () => {
        db = await freshDb()
        await seedParty(db, 'The Carters', ['Cat Carter'], [{ night: 'of', choice: 'share_named', shareWith: 'Jo Jones' }])
      })
      s.When('the admin opens the rooming view', async () => {
        wrapper = await mountRooms(db)
      })
      s.Then(`the room shows that name alongside the party's own guest`, () => {
        const room = wrapper.find('[data-room]')
        expect(room.text()).toContain('Cat Carter')
        expect(room.text()).toContain('Jo Jones')
      })
    })
  })

  f.Rule('Venue rooming list export', (r) => {
    const roomingSheet = async (db: Db) => {
      const ExcelJS = (await import('exceljs')).default
      const { buildVenueWorkbook } = await import(`../../server/utils/${'export'}.ts`)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await buildVenueWorkbook(db) as never)
      const sheet = workbook.getWorksheet('Rooming')
      expect(sheet, 'Rooming worksheet').toBeTruthy()
      const rows: string[] = []
      sheet!.eachRow((row) => {
        rows.push((row.values as unknown[]).slice(1).map(value => String(value ?? '')).join(' | '))
      })
      return rows
    }

    r.RuleScenario('Rooming sheet in the venue pack', (s) => {
      let db: Db
      let rows: string[] = []
      s.Given('booked rooms across both nights', async () => {
        db = await freshDb()
        const [ann] = await seedParty(db, 'The Ables', ['Ann Able'], [{ night: 'of', choice: 'share_match' }])
        const [ben] = await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
        await seedParty(db, 'The Carters', ['Cat Carter', 'Col Carter'], [{ night: 'before', choice: 'our_room', occupants: 2 }])
        const { pairRooms } = await allocationUtil()
        expect(await pairRooms(db, ann!, ben!)).toEqual({ ok: true })
      })
      s.When('the admin requests the venue export', async () => {
        rows = await roomingSheet(db)
      })
      s.Then('the workbook contains a rooming sheet with one row per room, listing night, occupants, and parties', () => {
        // header + one shared room + one own room
        expect(rows).toHaveLength(3)
        const shared = rows.find(row => row.includes('Ann Able'))!
        expect(shared).toMatch(/night of/i)
        expect(shared).toContain('Ben Baker')
        expect(shared).toContain('The Ables')
        expect(shared).toContain('The Bakers')
        const own = rows.find(row => row.includes('Cat Carter'))!
        expect(own).toMatch(/night before/i)
        expect(own).toContain('Col Carter')
        expect(own).toContain('The Carters')
      })
    })

    r.RuleScenario('Unallocated rooms flagged in the export', (s) => {
      let db: Db
      let rows: string[] = []
      s.Given('a match-me request with no partner at export time', async () => {
        db = await freshDb()
        await seedParty(db, 'The Bakers', ['Ben Baker'], [{ night: 'of', choice: 'share_match' }])
      })
      s.When('the venue workbook is generated', async () => {
        rows = await roomingSheet(db)
      })
      s.Then('its row appears on the rooming sheet marked as unallocated', () => {
        const row = rows.find(entry => entry.includes('Ben Baker'))
        expect(row).toBeTruthy()
        expect(row).toMatch(/unallocated/i)
      })
    })
  })
})
