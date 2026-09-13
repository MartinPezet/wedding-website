// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { readBody } from 'h3'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/rsvp-flow.feature')

interface GuestData {
  id: number
  name: string
  isChild: boolean
  attending: boolean | null
}

interface RsvpData {
  partyId: number
  party: { name: string, songRequest: string | null, noteToCouple: string | null, respondedAt: string | null } | null
  guests: GuestData[]
  rooms: never[]
  phone: string | null
  deadline: string | null
  paymentDeadline: string | null
  locked: boolean
}

const guest = (id: number, name: string, over: Partial<GuestData> = {}): GuestData =>
  ({ id, name, isChild: false, attending: null, ...over })

const rsvpData = (over: Partial<RsvpData> = {}): RsvpData => ({
  partyId: 12,
  party: { name: 'The Smiths', songRequest: null, noteToCouple: null, respondedAt: null },
  guests: [guest(1, 'Alice Smith'), guest(2, 'Bob Smith')],
  rooms: [],
  phone: null,
  deadline: '2100-01-01T00:00:00Z',
  paymentDeadline: '2026-12-01T00:00:00Z',
  locked: false,
  ...over,
})

// POST capture — reset in mountRsvp before each scenario's mount
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

const submit = async (wrapper: Wrapper) => {
  await wrapper.find('form').trigger('submit')
  await new Promise(resolve => setTimeout(resolve, 10))
}

// server-side pieces exercised directly against a memory db
const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

const seedParty = async (db: Awaited<ReturnType<typeof freshDb>>, deadline = '2100-01-01T00:00:00Z') => {
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

describeFeature(feature, (f) => {
  f.Rule('Party identified by token', (r) => {
    r.RuleScenario('QR arrival', (s) => {
      let wrapper: Wrapper
      s.Given('a valid party token URL', () => {})
      s.When('a guest opens the site via that URL', async () => {
        wrapper = await mountRsvp(rsvpData())
      })
      s.Then(`the RSVP page greets the party and lists each member's name ready for responses`, () => {
        const html = wrapper.html()
        expect(html).toContain('The Smiths')
        expect(html).toContain('Alice Smith')
        expect(html).toContain('Bob Smith')
        expect(wrapper.find('input[name="attending-1"]').exists()).toBe(true)
        expect(wrapper.find('input[name="attending-2"]').exists()).toBe(true)
      })
    })

    r.RuleScenario('No token', (s) => {
      let wrapper: Wrapper
      s.Given('a password-authenticated visitor without party context', () => {})
      s.When('they open the RSVP page', async () => {
        wrapper = await mountRsvp(rsvpData({ party: null, guests: [] }))
      })
      s.Then('they see guidance to use their invite QR or link, or contact the couple', () => {
        const html = wrapper.html()
        expect(html).toMatch(/invit/i)
        expect(html).toMatch(/contact/i)
        expect(wrapper.find('form').exists()).toBe(false)
      })
    })
  })

  f.Rule('Per-guest attendance', (r) => {
    r.RuleScenario('Attending guest recorded', (s) => {
      let wrapper: Wrapper
      let formHtml = ''
      s.Given('a guest marked attending', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="yes"]').setValue(true)
        formHtml = wrapper.html()
      })
      s.When('the RSVP is submitted', async () => {
        await submit(wrapper)
      })
      s.Then('the attendance is recorded and no meal, course choice, or dietary note is requested on this page', () => {
        expect(posted).toMatchObject({ guests: [{ id: 1, attending: true }] })
        // meals and dietary notes both live on the food-choice page now
        expect(formHtml).not.toMatch(/name="meal-/)
        expect(formHtml).not.toMatch(/name="dietary-/)
        expect(posted).not.toMatchObject({ guests: [{ dietaryNotes: expect.anything() }] })
      })
    })

    r.RuleScenario('Resubmitting the RSVP preserves dietary notes', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      s.Given('dietary notes already entered on the food-choice page', async () => {
        db = await freshDb()
        ids = await seedParty(db)
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        await db.update(guests).set({ attending: true, dietaryNotes: 'no nuts' }).where(eq(guests.id, ids.guestId))
      })
      s.When('the RSVP is resubmitted', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        const result = await saveRsvp(db, ids.partyId, {
          phone: '',
          guests: [{ id: ids.guestId, attending: true }],
        })
        expect(result).toEqual({ ok: true })
      })
      s.Then('the stored dietary notes are left untouched', async () => {
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const [stored] = await db.select().from(guests).where(eq(guests.id, ids.guestId))
        expect(stored!.dietaryNotes).toBe('no nuts')
      })
    })

    r.RuleScenario('Declining guest', (s) => {
      let wrapper: Wrapper
      s.Given('a guest marked not attending', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="no"]').setValue(true)
      })
      s.When('the RSVP is submitted', async () => {
        await submit(wrapper)
      })
      s.Then('the decline is recorded with graceful confirmation copy', () => {
        expect(posted).toMatchObject({ guests: [{ id: 1, attending: false }] })
        expect(wrapper.html()).toMatch(/miss you|sorry you can/i)
      })
    })
  })

  f.Rule('No contact details asked on the RSVP page', (r) => {
    r.RuleScenario('Attending party submits without a phone', (s) => {
      let wrapper: Wrapper
      let serverResult: { ok: boolean }
      s.Given('a party with attending guests and no phone field on the page', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="yes"]').setValue(true)
        expect(wrapper.find('input[name="phone"]').exists()).toBe(false)
      })
      s.When('the RSVP is submitted', async () => {
        await submit(wrapper)
        const db = await freshDb()
        const ids = await seedParty(db)
        const { saveRsvp } = await import('../../server/utils/rsvp')
        serverResult = await saveRsvp(db, ids.partyId, {
          phone: '',
          guests: [{ id: ids.guestId, attending: true }],
        })
      })
      s.Then('the submission is accepted and no phone is required', () => {
        expect(posted).toMatchObject({ guests: [{ id: 1, attending: true }] })
        expect(serverResult.ok).toBe(true)
      })
    })

    r.RuleScenario('Admin-supplied phone still validated', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      let rejected: { ok: boolean }
      s.Given('an admin edit supplying an invalid phone number', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the server processes it', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        rejected = await saveRsvp(db, ids.partyId, {
          phone: 'not-a-number',
          guests: [{ id: ids.guestId, attending: true }],
        }, { admin: true })
        // a good one from the same route is still normalised and stored
        const accepted = await saveRsvp(db, ids.partyId, {
          phone: '07911 123456',
          guests: [{ id: ids.guestId, attending: true }],
        }, { admin: true })
        expect(accepted.ok).toBe(true)
      })
      s.Then('the submission is rejected', async () => {
        expect(rejected.ok).toBe(false)
        const { guests: guestsTable } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const [stored] = await db.select().from(guestsTable).where(eq(guestsTable.id, ids.guestId))
        expect(stored!.phone).toBe('+447911123456')
      })
    })
  })

  f.Rule('Song request and note to couple', (r) => {
    r.RuleScenario('Extras submitted', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      s.Given('a party providing a song request and a note', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP is submitted', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        const result = await saveRsvp(db, ids.partyId, {
          phone: '+447911123456',
          songRequest: 'Dancing Queen',
          noteToCouple: 'So happy for you both!',
          guests: [{ id: ids.guestId, attending: true }],
        })
        expect(result).toEqual({ ok: true })
      })
      s.Then(`both are stored with the party's RSVP`, async () => {
        const party = await db.query.parties.findFirst(
          { where: (parties, { eq }) => eq(parties.id, ids.partyId) },
        )
        expect(party).toMatchObject({
          songRequest: 'Dancing Queen',
          noteToCouple: 'So happy for you both!',
        })
        expect(party!.respondedAt).toBeTruthy()
      })
    })
  })

  f.Rule('RSVP editable until deadline', (r) => {
    r.RuleScenario('Revisit before deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a responded party before the deadline', () => {})
      s.When('it revisits its RSVP link', async () => {
        wrapper = await mountRsvp(rsvpData({
          party: { name: 'The Smiths', songRequest: 'Dancing Queen', noteToCouple: null, respondedAt: '2026-01-01T00:00:00Z' },
          guests: [guest(1, 'Alice Smith', { attending: true })],
        }))
      })
      s.Then('the form is pre-filled with current answers and can be resubmitted', async () => {
        expect((wrapper.find('input[name="attending-1"][value="yes"]').element as HTMLInputElement).checked).toBe(true)
        expect((wrapper.find('input[name="song"]').element as HTMLInputElement).value).toBe('Dancing Queen')
        await submit(wrapper)
        expect(posted).toMatchObject({ songRequest: 'Dancing Queen' })
      })
    })

    r.RuleScenario('After deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a party after the RSVP deadline', () => {})
      s.When('it opens its RSVP link', async () => {
        wrapper = await mountRsvp(rsvpData({
          locked: true,
          deadline: '2020-01-01T00:00:00Z',
          guests: [guest(1, 'Alice Smith', { attending: true })],
        }))
      })
      s.Then('a read-only summary is shown with instructions to contact the couple', () => {
        const html = wrapper.html()
        expect(html).toMatch(/contact/i)
        expect(html).toContain('Alice Smith')
        expect(wrapper.find('form').exists()).toBe(false)
      })
    })

    r.RuleScenario('Post-deadline submission blocked server-side', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a submission arriving after the deadline', async () => {
        db = await freshDb()
        ids = await seedParty(db, '2020-01-01T00:00:00Z')
      })
      s.When('the server processes it', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        result = await saveRsvp(db, ids.partyId, {
          phone: '+447911123456',
          guests: [{ id: ids.guestId, attending: false }],
        })
      })
      s.Then('it is rejected regardless of client state', () => {
        expect(result.ok).toBe(false)
      })
    })
  })

  // Rule "Mobile-first RSVP experience" contains only a @manual scenario —
  // excluded by the runner configuration above.
})
