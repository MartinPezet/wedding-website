// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { readBody } from 'h3'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'
import { menu } from '../../shared/content'
import type { MenuCourse } from '../../shared/content'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/rsvp-flow.feature')

// course id → guest field; the per-course contract under test
const COURSE_FIELDS = { starter: 'starterChoiceId', main: 'mainChoiceId', dessert: 'dessertChoiceId' } as const
type CourseChoiceFields = Partial<Record<(typeof COURSE_FIELDS)[keyof typeof COURSE_FIELDS], string | null>>

interface GuestData extends CourseChoiceFields {
  id: number
  name: string
  isChild: boolean
  attending: boolean | null
  dietaryNotes: string | null
}

interface RsvpData {
  party: { name: string, songRequest: string | null, noteToCouple: string | null, respondedAt: string | null } | null
  guests: GuestData[]
  phone: string | null
  deadline: string | null
  locked: boolean
}

const guest = (id: number, name: string, over: Partial<GuestData> = {}): GuestData =>
  ({ id, name, isChild: false, attending: null, starterChoiceId: null, mainChoiceId: null, dessertChoiceId: null, dietaryNotes: null, ...over })

const rsvpData = (over: Partial<RsvpData> = {}): RsvpData => ({
  party: { name: 'The Smiths', songRequest: null, noteToCouple: null, respondedAt: null },
  guests: [guest(1, 'Alice Smith'), guest(2, 'Bob Smith')],
  phone: null,
  deadline: '2100-01-01T00:00:00Z',
  locked: false,
  ...over,
})

const optionsFor = (course: MenuCourse, isChild: boolean) =>
  isChild && course.childOptions?.length ? course.childOptions : course.options

/** one valid choice per defined course, as submission fields */
const fullChoices = (isChild = false): CourseChoiceFields =>
  Object.fromEntries(menu.courses.map(course => [COURSE_FIELDS[course.id], optionsFor(course, isChild)[0]!.id]))

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

  f.Rule('Per-guest attendance and meal choice', (r) => {
    r.RuleScenario('Attending guest picks meal', (s) => {
      let wrapper: Wrapper
      s.Given('a guest marked attending', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="yes"]').setValue(true)
      })
      s.When('the RSVP form is completed', () => {
        expect(menu.courses.length).toBeGreaterThan(0)
      })
      s.Then('a choice is required for each course defined in menu.json and dietary notes may be entered', () => {
        for (const course of menu.courses) {
          const select = wrapper.find(`select[name="meal-${course.id}-1"]`)
          expect(select.exists(), `select for ${course.id}`).toBe(true)
          expect(select.attributes('required')).toBeDefined()
          for (const option of course.options) {
            expect(select.html()).toContain(option.name)
          }
        }
        expect(wrapper.find('textarea[name="dietary-1"]').exists()).toBe(true)
      })
    })

    r.RuleScenario('Absent course not offered', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      let twoCourseMenu: { courses: MenuCourse[] }
      let result: { ok: boolean }
      s.Given('a menu that does not define one of the courses', async () => {
        twoCourseMenu = { courses: menu.courses.filter(course => course.id !== 'dessert') }
        expect(twoCourseMenu.courses.some(course => course.id === 'dessert')).toBe(false)
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP form is completed and validated', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        result = await saveRsvp(db, ids.partyId, {
          phone: '+447911123456',
          guests: [{
            id: ids.guestId,
            attending: true,
            starterChoiceId: menu.courses.find(course => course.id === 'starter')!.options[0]!.id,
            mainChoiceId: menu.courses.find(course => course.id === 'main')!.options[0]!.id,
            // dessert submitted anyway — must be ignored, not required, not stored
            dessertChoiceId: 'cake',
          }],
        }, { menu: twoCourseMenu })
      })
      s.Then('the absent course is neither shown nor required for any guest', async () => {
        expect(result.ok).toBe(true)
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const [stored] = await db.select().from(guests).where(eq(guests.id, ids.guestId))
        expect(stored!.dessertChoiceId).toBeNull()
        expect(stored!.mainChoiceId).toBeTruthy()
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
      s.Then('no course choices are required and the decline is recorded with graceful confirmation copy', () => {
        expect(posted).toMatchObject({ guests: [{ id: 1, attending: false }] })
        expect(wrapper.html()).toMatch(/miss you|sorry you can/i)
      })
    })

    r.RuleScenario('Child menu offered', (s) => {
      let wrapper: Wrapper
      let courseWithChildOptions: MenuCourse
      s.Given('a child-flagged guest marked attending and a course with child options in menu.json', async () => {
        courseWithChildOptions = menu.courses.find(course => course.childOptions?.length)!
        expect(courseWithChildOptions).toBeTruthy()
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Sunny Smith', { isChild: true })] }))
        await wrapper.find('input[name="attending-1"][value="yes"]').setValue(true)
      })
      s.When(`that course's options are presented`, () => {})
      s.Then('they are the child options', () => {
        const select = wrapper.find(`select[name="meal-${courseWithChildOptions.id}-1"]`)
        for (const option of courseWithChildOptions.childOptions!) {
          expect(select.html()).toContain(option.name)
        }
        for (const option of courseWithChildOptions.options) {
          expect(select.html()).not.toContain(option.name)
        }
      })
    })
  })

  f.Rule('Required contact phone', (r) => {
    r.RuleScenario('Valid international number', (s) => {
      let db: Awaited<ReturnType<typeof freshDb>>
      let ids: { partyId: number, guestId: number }
      s.Given('a party entering a valid phone number in a common national or international format', async () => {
        db = await freshDb()
        ids = await seedParty(db)
      })
      s.When('the RSVP is submitted', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        const result = await saveRsvp(db, ids.partyId, {
          phone: '07911 123456',
          guests: [{ id: ids.guestId, attending: true, ...fullChoices() }],
        })
        expect(result.ok).toBe(true)
      })
      s.Then('the number is accepted, normalised to E.164, and stored', async () => {
        const { guests: guestsTable } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        const [stored] = await db.select().from(guestsTable).where(eq(guestsTable.id, ids.guestId))
        expect(stored!.phone).toBe('+447911123456')
      })
    })

    r.RuleScenario('Invalid number', (s) => {
      let wrapper: Wrapper
      let serverResult: { ok: boolean }
      s.Given('a party entering an invalid phone number', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="no"]').setValue(true)
        await wrapper.find('input[name="phone"]').setValue('not-a-number')
      })
      s.When('the RSVP is submitted', async () => {
        await submit(wrapper)
        const db = await freshDb()
        const ids = await seedParty(db)
        const { saveRsvp } = await import('../../server/utils/rsvp')
        serverResult = await saveRsvp(db, ids.partyId, {
          phone: 'not-a-number',
          guests: [{ id: ids.guestId, attending: false }],
        })
      })
      s.Then('the form shows a validation error and the server rejects the submission', () => {
        expect(posted).toBeNull()
        expect(wrapper.find('[role="alert"]').text()).toMatch(/phone/i)
        expect(serverResult.ok).toBe(false)
      })
    })

    r.RuleScenario('Declining party without phone', (s) => {
      let wrapper: Wrapper
      let serverResult: { ok: boolean }
      s.Given('a party where every guest is marked not attending and no phone number is entered', async () => {
        wrapper = await mountRsvp(rsvpData({ guests: [guest(1, 'Alice Smith')] }))
        await wrapper.find('input[name="attending-1"][value="no"]').setValue(true)
      })
      s.When('the RSVP is submitted', async () => {
        await submit(wrapper)
        const db = await freshDb()
        const ids = await seedParty(db)
        const { saveRsvp } = await import('../../server/utils/rsvp')
        serverResult = await saveRsvp(db, ids.partyId, {
          phone: '',
          guests: [{ id: ids.guestId, attending: false }],
        })
      })
      s.Then('the submission is accepted with no phone requirement', () => {
        expect(posted).toMatchObject({ guests: [{ id: 1, attending: false }] })
        expect(serverResult.ok).toBe(true)
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
          guests: [{ id: ids.guestId, attending: true, ...fullChoices() }],
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
      let choices: CourseChoiceFields
      s.Given('a responded party before the deadline', () => {
        choices = fullChoices()
      })
      s.When('it revisits its RSVP link', async () => {
        wrapper = await mountRsvp(rsvpData({
          party: { name: 'The Smiths', songRequest: 'Dancing Queen', noteToCouple: null, respondedAt: '2026-01-01T00:00:00Z' },
          guests: [guest(1, 'Alice Smith', { attending: true, ...choices, dietaryNotes: 'no nuts' })],
          phone: '+447911123456',
        }))
      })
      s.Then('the form is pre-filled with current answers and can be resubmitted', async () => {
        expect((wrapper.find('input[name="attending-1"][value="yes"]').element as HTMLInputElement).checked).toBe(true)
        for (const course of menu.courses) {
          const select = wrapper.find(`select[name="meal-${course.id}-1"]`)
          expect((select.element as HTMLSelectElement).value).toBe(choices[COURSE_FIELDS[course.id]])
        }
        expect((wrapper.find('textarea[name="dietary-1"]').element as HTMLTextAreaElement).value).toBe('no nuts')
        expect((wrapper.find('input[name="phone"]').element as HTMLInputElement).value).toBe('+447911123456')
        expect((wrapper.find('input[name="song"]').element as HTMLInputElement).value).toBe('Dancing Queen')
        await submit(wrapper)
        expect(posted).toMatchObject({ phone: '+447911123456' })
      })
    })

    r.RuleScenario('After deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a party after the RSVP deadline', () => {})
      s.When('it opens its RSVP link', async () => {
        wrapper = await mountRsvp(rsvpData({
          locked: true,
          deadline: '2020-01-01T00:00:00Z',
          guests: [guest(1, 'Alice Smith', { attending: true, ...fullChoices() })],
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
