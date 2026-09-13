// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { readBody } from 'h3'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'
import type { RoomChoice, RoomNight } from '#shared/content'
import { maxRoomsPerNight, paymentReference, roomChoiceLabel, roomTotal } from '#shared/utils/rooms'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/room-booking.feature')

interface RoomForm {
  night: RoomNight
  choice: RoomChoice
  shareWith: string | null
  occupants: number
}

interface RsvpData {
  partyId: number
  party: { name: string, songRequest: string | null, noteToCouple: string | null, respondedAt: string | null } | null
  guests: { id: number, name: string, isChild: boolean, attending: boolean | null }[]
  rooms: RoomForm[]
  phone: string | null
  deadline: string | null
  paymentDeadline: string | null
  locked: boolean
}

const room = (night: RoomNight, choice: RoomChoice, over: Partial<RoomForm> = {}): RoomForm =>
  ({ night, choice, shareWith: null, occupants: 1, ...over })

const rsvpData = (over: Partial<RsvpData> = {}): RsvpData => ({
  partyId: 12,
  party: { name: 'The Smiths', songRequest: null, noteToCouple: null, respondedAt: null },
  guests: [
    { id: 1, name: 'Alice Smith', isChild: false, attending: true },
    { id: 2, name: 'Bob Smith', isChild: false, attending: true },
  ],
  rooms: [],
  phone: '+447911123456',
  deadline: '2100-01-01T00:00:00Z',
  paymentDeadline: '2026-12-01T00:00:00Z',
  locked: false,
  ...over,
})

const partyOf = (attending: number): RsvpData['guests'] =>
  Array.from({ length: attending }, (_, index) => ({
    id: index + 1,
    name: `Guest ${index + 1}`,
    isChild: false,
    attending: true,
  }))

/** click "Add a room" for one night as many times as the page still allows */
const addRoomsUntilCapped = async (wrapper: Wrapper, night: RoomNight, attempts: number) => {
  for (let i = 0; i < attempts; i++) {
    const button = wrapper.find(`[data-add-room="${night}"]`)
    if (!button.exists()) break
    await button.trigger('click')
  }
  return wrapper.findAll(`select[name^="room-${night}-"][name$="-choice"]`).length
}

let posted: unknown = null
registerEndpoint('/api/rsvp', {
  method: 'POST',
  handler: async (event) => {
    posted = await readBody(event)
    return { ok: true }
  },
})

const mountRsvp = async (data: RsvpData) => {
  posted = null
  clearNuxtData()
  registerEndpoint('/api/rsvp', { method: 'GET', handler: () => data })
  // dynamic path so a missing page fails scenarios, not the whole file
  const name = 'rsvp'
  const page = (await import(`../../app/pages/${name}.vue`)).default
  return mountSuspended(page)
}

type Wrapper = Awaited<ReturnType<typeof mountRsvp>>

// server-side pieces exercised directly against a memory db
const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

type TestDb = Awaited<ReturnType<typeof freshDb>>

const seedParty = async (db: TestDb, deadline = '2100-01-01T00:00:00Z') => {
  const { settings } = await import('../../server/db/schema')
  await db.insert(settings).values({ key: 'rsvp_deadline', value: deadline })
  const { createParty } = await import('../../server/utils/parties')
  const party = await createParty(db, { name: 'The Servers', guests: [{ name: 'Sid Server' }] })
  const full = await db.query.parties.findFirst({
    where: (parties, { eq }) => eq(parties.id, party.id),
    with: { guests: true },
  })
  return { partyId: party.id, guestId: full!.guests[0]!.id }
}

const storedRooms = async (db: TestDb, partyId: number) => {
  const { roomRequests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  return db.select().from(roomRequests).where(eq(roomRequests.partyId, partyId))
}

const submitRooms = async (db: TestDb, partyId: number, guestId: number, rooms: unknown[]) => {
  const { saveRsvp } = await import('../../server/utils/rsvp')
  return saveRsvp(db, partyId, {
    phone: '+447911123456',
    guests: [{ id: guestId, attending: true }],
    // deliberately loose: these scenarios feed invalid shapes through the boundary
    rooms: rooms as never,
  })
}

describeFeature(feature, (f) => {
  f.Rule('Per-night room booking', (r) => {
    r.RuleScenario('Multiple rooms booked for one night', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a party adding three rooms to the night-of list, each with a different choice', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP is submitted', async () => {
        result = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'of', choice: 'our_room', occupants: 2 },
          { night: 'of', choice: 'share_named', shareWith: 'Jo Jones' },
          { night: 'of', choice: 'share_match' },
        ])
      })
      s.Then('all three room requests are stored against that night for that party', async () => {
        expect(result.ok).toBe(true)
        const rows = await storedRooms(db, ids.partyId)
        expect(rows).toHaveLength(3)
        expect(rows.every(row => row.night === 'of')).toBe(true)
        expect(rows.map(row => row.choice).toSorted()).toEqual(['our_room', 'share_match', 'share_named'])
      })
    })

    r.RuleScenario('Named share captured', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      s.Given('a party booking a room with "share with another party" and a typed name', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP is submitted', async () => {
        const result = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'before', choice: 'share_named', shareWith: 'Jo Jones' },
        ])
        expect(result.ok).toBe(true)
      })
      s.Then('the room request stores that name alongside the choice', async () => {
        const rows = await storedRooms(db, ids.partyId)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({ choice: 'share_named', shareWith: 'Jo Jones' })
      })
    })

    r.RuleScenario('No rooms needed', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a party with no rooms added to either night', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP is submitted', async () => {
        result = await submitRooms(db, ids.partyId, ids.guestId, [])
      })
      s.Then('the submission is accepted and no room requests are stored', async () => {
        expect(result.ok).toBe(true)
        expect(await storedRooms(db, ids.partyId)).toHaveLength(0)
      })
    })
  })

  f.Rule('Room options scale with the attending party', (r) => {
    const sizeScenario = (label: string, attending: number, expected: string, cap: number) =>
      (s: Parameters<Parameters<typeof r.RuleScenario>[1]>[0]) => {
        let wrapper: Wrapper
        let rendered = 0
        s.Given(label, async () => {
          wrapper = await mountRsvp(rsvpData({ guests: partyOf(attending) }))
        })
        s.When('the room booking section is rendered', async () => {
          rendered = await addRoomsUntilCapped(wrapper, 'of', attending + 2)
        })
        s.Then(expected, () => {
          expect(maxRoomsPerNight(attending)).toBe(cap)
          expect(rendered).toBe(cap)
          // the add button is gone once the cap is reached
          expect(wrapper.find('[data-add-room="of"]').exists()).toBe(false)
          const choices = wrapper.find('select[name="room-of-0-choice"]').html()
          expect(choices).toContain(roomChoiceLabel('our_room', attending))
          expect(choices).toContain(roomChoiceLabel('share_named'))
          expect(choices).toContain(roomChoiceLabel('share_match'))
        })
      }

    r.RuleScenario(
      'Solo party wording and cap',
      sizeScenario(
        'a party with one attending guest',
        1,
        'the own-room option reads "A room for just me" and no second room can be added to a night',
        1,
      ),
    )

    r.RuleScenario(
      'Couple wording and cap',
      sizeScenario(
        'a party with two attending guests',
        2,
        'the own-room option reads "A room for just us" and no second room can be added to a night',
        1,
      ),
    )

    r.RuleScenario(
      'Larger party wording and cap',
      sizeScenario(
        'a party with more than two attending guests',
        4,
        'the own-room option reads "A whole room for some of us" and rooms may be added to a night up to the number of attending guests',
        4,
      ),
    )

    r.RuleScenario('Occupancy derived, never asked', (s) => {
      let wrapper: Wrapper
      s.Given('a party of three booking two rooms of their own for the night before', async () => {
        wrapper = await mountRsvp(rsvpData({
          guests: partyOf(3),
          rooms: [room('before', 'our_room'), room('before', 'our_room')],
        }))
      })
      s.When('the room booking section is rendered', () => {})
      s.Then('the first room is priced for two guests and the second for one, with no occupancy question shown', () => {
        expect(wrapper.html()).not.toMatch(/How many of you/i)
        expect(wrapper.find('select[name="room-before-0-occupants"]').exists()).toBe(false)
        // 95pp: the first room sleeps two of the three, the second the last one
        expect(wrapper.find('[data-room-total]').text()).toContain(`£${roomTotal([
          { night: 'before', choice: 'our_room', occupants: 2 },
          { night: 'before', choice: 'our_room', occupants: 1 },
        ])}`)
      })
    })

    r.RuleScenario('Cap applies per night', (s) => {
      let wrapper: Wrapper
      s.Given('a party of two that has already booked its one room for the night of the wedding', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: partyOf(2) }))
        await addRoomsUntilCapped(wrapper, 'of', 3)
        expect(wrapper.find('[data-add-room="of"]').exists()).toBe(false)
      })
      s.When('the night-before list is inspected', () => {})
      s.Then('it may still book a room for the night before', async () => {
        expect(wrapper.find('[data-add-room="before"]').exists()).toBe(true)
        expect(await addRoomsUntilCapped(wrapper, 'before', 3)).toBe(1)
      })
    })
  })

  f.Rule('Independent per-night pricing', (r) => {
    r.RuleScenario('Night-of pricing', (s) => {
      let booked: { night: RoomNight, choice: RoomChoice, occupants: number }[]
      let total: number
      s.Given('a party booking one "our room" and one "share with another party" room for the night of the wedding', () => {
        booked = [
          { night: 'of', choice: 'our_room', occupants: 2 },
          { night: 'of', choice: 'share_named', occupants: 1 },
        ]
      })
      s.When('the total is computed', () => {
        total = roomTotal(booked)
      })
      s.Then('the computed total for that night is £160 + £80', () => {
        expect(total).toBe(240)
      })
    })

    r.RuleScenario('Night-before pricing', (s) => {
      let booked: { night: RoomNight, choice: RoomChoice, occupants: number }[]
      let total: number
      s.Given('a party booking an "our room" for the night before with two of their own guests', () => {
        booked = [{ night: 'before', choice: 'our_room', occupants: 2 }]
      })
      s.When('the total is computed', () => {
        total = roomTotal(booked)
      })
      s.Then('the computed total for that night is £190', () => {
        expect(total).toBe(190)
      })
    })
  })

  f.Rule('Running total and Monzo payment link', (r) => {
    r.RuleScenario('Total shown next to link', (s) => {
      let wrapper: Wrapper
      let data: RsvpData
      s.Given('a party with rooms booked totalling £540', () => {
        // 160 (own room, night of) + 190 + 190 (two own rooms of two, night before)
        data = rsvpData({
          guests: partyOf(4),
          rooms: [
            room('of', 'our_room', { occupants: 2 }),
            room('before', 'our_room', { occupants: 2 }),
            room('before', 'our_room', { occupants: 2 }),
          ],
        })
        expect(roomTotal(data.rooms)).toBe(540)
      })
      s.When('the RSVP page renders', async () => {
        wrapper = await mountRsvp(data)
      })
      s.Then(`the page shows "£540" next to the Monzo link, and the link is pre-filled with that amount and the party's reference`, () => {
        expect(wrapper.find('[data-room-total]').text()).toContain('£540')
        const link = wrapper.find('a[data-monzo-link]')
        expect(link.exists()).toBe(true)
        const href = new URL(link.attributes('href')!)
        expect(href.host).toBe('monzo.me')
        // monzo.me reads the amount off the end of the path, not a query param
        expect(href.pathname.endsWith('/540')).toBe(true)
        expect(href.searchParams.get('d')).toBe(paymentReference(data.partyId))
      })
    })

    r.RuleScenario('Payment disclaimer shown', (s) => {
      let wrapper: Wrapper
      s.Given('the RSVP page renders the room booking section', async () => {
        wrapper = await mountRsvp(rsvpData({ rooms: [room('of', 'our_room', { occupants: 2 })] }))
      })
      s.When('a party views it', () => {})
      s.Then('a disclaimer above the Monzo link states the payment deadline date', () => {
        const disclaimer = wrapper.find('[data-payment-disclaimer]')
        expect(disclaimer.exists()).toBe(true)
        expect(disclaimer.text()).toContain('1 December 2026')
        const html = wrapper.html()
        expect(html.indexOf('data-payment-disclaimer')).toBeLessThan(html.indexOf('data-monzo-link'))
      })
    })

    r.RuleScenario('No rooms, no total shown', (s) => {
      let wrapper: Wrapper
      s.Given('a party with no rooms booked', () => {})
      s.When('the RSVP page renders', async () => {
        wrapper = await mountRsvp(rsvpData({ rooms: [] }))
      })
      s.Then('no total or Monzo link is shown', () => {
        expect(wrapper.find('[data-room-total]').exists()).toBe(false)
        expect(wrapper.find('a[data-monzo-link]').exists()).toBe(false)
      })
    })
  })

  f.Rule('Room booking validated server-side', (r) => {
    r.RuleScenario('Invalid choice rejected', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a submission with a room request carrying an unrecognised choice value', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the server processes it', async () => {
        result = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'of', choice: 'penthouse' },
        ])
      })
      s.Then(`the server rejects the submission and stores nothing for that party's rooms`, async () => {
        expect(result.ok).toBe(false)
        expect(await storedRooms(db, ids.partyId)).toHaveLength(0)
      })
    })

    r.RuleScenario('Missing share-with name rejected', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a submission with a "share with another party" room request with no name', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the server processes it', async () => {
        result = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'of', choice: 'share_named', shareWith: '  ' },
        ])
      })
      s.Then('the server rejects the submission', async () => {
        expect(result.ok).toBe(false)
        expect(await storedRooms(db, ids.partyId)).toHaveLength(0)
      })
    })

    r.RuleScenario('Resubmission replaces prior rooms', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      s.Given('a party resubmitting with a different set of rooms than their previous submission', async () => {
        db = await freshDb()
        ids = await seedParty(db)
        const first = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'of', choice: 'our_room', occupants: 2 },
          { night: 'of', choice: 'share_match' },
        ])
        expect(first.ok).toBe(true)
        expect(await storedRooms(db, ids.partyId)).toHaveLength(2)
      })
      s.When('the server processes it', async () => {
        const result = await submitRooms(db, ids.partyId, ids.guestId, [
          { night: 'before', choice: 'share_named', shareWith: 'Jo Jones' },
        ])
        expect(result.ok).toBe(true)
      })
      s.Then('the stored room requests exactly match the new submission, with no leftover rows from the previous one', async () => {
        const rows = await storedRooms(db, ids.partyId)
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({ night: 'before', choice: 'share_named', shareWith: 'Jo Jones' })
      })
    })
  })

  f.Rule('Room booking editable until the RSVP deadline', (r) => {
    r.RuleScenario('Revisit before deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a party revisiting its RSVP link before the deadline', () => {})
      s.When('the page loads', async () => {
        wrapper = await mountRsvp(rsvpData({
          rooms: [
            room('of', 'share_named', { shareWith: 'Jo Jones' }),
            room('before', 'our_room', { occupants: 2 }),
          ],
        }))
      })
      s.Then('their previously booked rooms are pre-filled and can be changed', async () => {
        const nightOfChoice = wrapper.find('select[name="room-of-0-choice"]')
        expect(nightOfChoice.exists()).toBe(true)
        expect((nightOfChoice.element as HTMLSelectElement).value).toBe('share_named')
        expect((wrapper.find('input[name="room-of-0-share"]').element as HTMLInputElement).value).toBe('Jo Jones')
        const nightBeforeChoice = wrapper.find('select[name="room-before-0-choice"]')
        expect((nightBeforeChoice.element as HTMLSelectElement).value).toBe('our_room')
        // occupancy follows the attending party rather than being asked for
        expect(wrapper.find('select[name="room-before-0-occupants"]').exists()).toBe(false)
        expect(wrapper.html()).not.toMatch(/How many of you/i)

        await nightOfChoice.setValue('share_match')
        await wrapper.find('form').trigger('submit')
        await new Promise(resolve => setTimeout(resolve, 10))
        expect(posted).toMatchObject({
          rooms: [
            { night: 'before', choice: 'our_room', occupants: 2 },
            { night: 'of', choice: 'share_match' },
          ],
        })
      })
    })

    r.RuleScenario('Locked after deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a party opening its RSVP link after the deadline', () => {})
      s.When('the page loads', async () => {
        wrapper = await mountRsvp(rsvpData({
          locked: true,
          deadline: '2020-01-01T00:00:00Z',
          rooms: [room('of', 'share_named', { shareWith: 'Jo Jones' })],
        }))
      })
      s.Then('their room bookings are shown read-only alongside the rest of the locked summary', () => {
        expect(wrapper.find('form').exists()).toBe(false)
        const html = wrapper.html()
        expect(html).toContain('Jo Jones')
        expect(html).toMatch(/night of the wedding/i)
      })
    })
  })
})
