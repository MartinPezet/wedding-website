// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { readBody } from 'h3'
import { expect } from 'vitest'
import { clearNuxtData } from '#imports'
import { menu } from '#shared/content'
import { COURSE_FIELDS, optionsFor } from '#shared/utils/menu'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/food-choice.feature')

type CourseFields = Partial<Record<(typeof COURSE_FIELDS)[keyof typeof COURSE_FIELDS], string | null>>

interface GuestData extends CourseFields {
  id: number
  name: string
  isChild: boolean
  attending: boolean | null
  dietaryNotes: string | null
}

interface FoodData {
  party: { name: string } | null
  guests: GuestData[]
  open: boolean
  deadline: string | null
  locked: boolean
}

const guest = (id: number, name: string, over: Partial<GuestData> = {}): GuestData => ({
  id,
  name,
  isChild: false,
  attending: true,
  starterChoiceId: null,
  mainChoiceId: null,
  dessertChoiceId: null,
  dietaryNotes: null,
  ...over,
})

const foodData = (over: Partial<FoodData> = {}): FoodData => ({
  party: { name: 'The Smiths' },
  guests: [guest(1, 'Alice Smith')],
  open: true,
  deadline: '2100-01-01T00:00:00Z',
  locked: false,
  ...over,
})

/** one valid choice per defined course, as submission fields */
const fullChoices = (isChild = false): CourseFields =>
  Object.fromEntries(menu.courses.map(course => [COURSE_FIELDS[course.id], optionsFor(course, isChild)[0]!.id]))

let posted: unknown = null
registerEndpoint('/api/food', {
  method: 'POST',
  handler: async (event) => {
    posted = await readBody(event)
    return { ok: true }
  },
})

const mountMenu = async (data: FoodData) => {
  posted = null
  clearNuxtData()
  registerEndpoint('/api/food', { method: 'GET', handler: () => data })
  // dynamic path so a missing page fails scenarios, not the whole file
  const name = 'menu'
  const page = (await import(`../../app/pages/${name}.vue`)).default
  return mountSuspended(page)
}

type Wrapper = Awaited<ReturnType<typeof mountMenu>>

// server-side pieces exercised directly against a memory db
const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

type TestDb = Awaited<ReturnType<typeof freshDb>>

const setSetting = async (db: TestDb, key: string, value: string) => {
  const { settings } = await import('../../server/db/schema')
  await db.insert(settings).values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
}

const seedParty = async (db: TestDb, attending = true) => {
  const { createParty } = await import('../../server/utils/parties')
  const party = await createParty(db, { name: 'The Servers', guests: [{ name: 'Sid Server' }] })
  const full = await db.query.parties.findFirst({
    where: (parties, { eq }) => eq(parties.id, party.id),
    with: { guests: true },
  })
  const guestId = full!.guests[0]!.id
  const { guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  await db.update(guests).set({ attending }).where(eq(guests.id, guestId))
  return { partyId: party.id, guestId }
}

/** a db with the food page open and a party of one attending guest */
const openFoodDb = async (deadline = '2100-01-01T00:00:00Z') => {
  const db = await freshDb()
  await setSetting(db, 'food_choice_open', 'true')
  await setSetting(db, 'food_deadline', deadline)
  return { db, ...(await seedParty(db)) }
}

const storedGuest = async (db: TestDb, guestId: number) => {
  const { guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const [row] = await db.select().from(guests).where(eq(guests.id, guestId))
  return row!
}

describeFeature(feature, (f) => {
  f.Rule('Food-choice page gated by admin toggle', (r) => {
    r.RuleScenario('Toggle off shows closed-state copy', (s) => {
      let wrapper: Wrapper
      s.Given('the food-choice toggle is off', () => {})
      s.When('a party opens the food-choice page', async () => {
        wrapper = await mountMenu(foodData({ open: false }))
      })
      s.Then(`they see copy saying the menu isn't ready yet and they'll be told when it is, with no course selectors shown`, () => {
        const html = wrapper.html()
        expect(html).toMatch(/not ready|isn't ready/i)
        expect(html).toMatch(/let you know|tell you/i)
        expect(wrapper.findAll('select').length).toBe(0)
        expect(wrapper.find('form').exists()).toBe(false)
      })
    })

    r.RuleScenario('Toggle on shows the form', (s) => {
      let wrapper: Wrapper
      s.Given('the admin has switched the toggle on', () => {})
      s.When('a party opens the food-choice page', async () => {
        wrapper = await mountMenu(foodData({ open: true }))
      })
      s.Then('the food-choice page shows the meal form', () => {
        expect(wrapper.find('form').exists()).toBe(true)
        for (const course of menu.courses) {
          expect(wrapper.find(`select[name="meal-${course.id}-1"]`).exists()).toBe(true)
        }
      })
    })
  })

  f.Rule('Per-guest meal choice and dietary notes', (r) => {
    r.RuleScenario('Attending guest picks meal', (s) => {
      let wrapper: Wrapper
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let missingCourse: { ok: boolean }
      s.Given('an attending guest on the food-choice page', async () => {
        wrapper = await mountMenu(foodData())
        const seeded = await openFoodDb()
        db = seeded.db
        ids = { partyId: seeded.partyId, guestId: seeded.guestId }
      })
      s.When('their course choices are submitted', async () => {
        const { saveFood } = await import('../../server/utils/food')
        const complete = await saveFood(db, ids.partyId, {
          guests: [{ id: ids.guestId, ...fullChoices(), dietaryNotes: 'no nuts' }],
        })
        expect(complete).toEqual({ ok: true })
        missingCourse = await saveFood(db, ids.partyId, {
          guests: [{ id: ids.guestId }],
        })
      })
      s.Then('a choice is required for each course defined in menu.json and dietary notes may be entered', async () => {
        expect(menu.courses.length).toBeGreaterThan(0)
        for (const course of menu.courses) {
          const select = wrapper.find(`select[name="meal-${course.id}-1"]`)
          expect(select.exists(), `select for ${course.id}`).toBe(true)
          expect(select.attributes('required')).toBeDefined()
          for (const option of course.options) {
            expect(select.html()).toContain(option.name)
          }
        }
        expect(wrapper.find('textarea[name="dietary-1"]').exists()).toBe(true)
        // and the server insists on the same
        expect(missingCourse.ok).toBe(false)
        const stored = await storedGuest(db, ids.guestId)
        expect(stored.mainChoiceId).toBe(fullChoices().mainChoiceId)
        expect(stored.dietaryNotes).toBe('no nuts')
      })
    })

    r.RuleScenario('Non-attending guest not offered a choice', (s) => {
      let wrapper: Wrapper
      let rejected: { ok: boolean }
      s.Given('a guest marked not attending on the RSVP page', async () => {
        const db = await freshDb()
        await setSetting(db, 'food_choice_open', 'true')
        const ids = await seedParty(db, false)
        const { saveFood } = await import('../../server/utils/food')
        rejected = await saveFood(db, ids.partyId, {
          guests: [{ id: ids.guestId, ...fullChoices() }],
        })
      })
      s.When('the food-choice page is rendered', async () => {
        wrapper = await mountMenu(foodData({
          guests: [guest(1, 'Alice Smith'), guest(2, 'Bob Smith', { attending: false })],
        }))
      })
      s.Then('it does not ask for or accept a meal choice for that guest', () => {
        for (const course of menu.courses) {
          expect(wrapper.find(`select[name="meal-${course.id}-1"]`).exists()).toBe(true)
          expect(wrapper.find(`select[name="meal-${course.id}-2"]`).exists()).toBe(false)
        }
        expect(rejected.ok).toBe(false)
      })
    })

    r.RuleScenario('RSVP required first', (s) => {
      let wrapper: Wrapper
      s.Given('a party with no recorded attending guests', () => {})
      s.When('they open the food-choice page', async () => {
        wrapper = await mountMenu(foodData({
          guests: [guest(1, 'Alice Smith', { attending: null })],
        }))
      })
      s.Then('they are prompted to complete the RSVP page first rather than shown a meal form', () => {
        expect(wrapper.html()).toMatch(/rsvp/i)
        expect(wrapper.find('a[href="/rsvp"]').exists()).toBe(true)
        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.findAll('select').length).toBe(0)
      })
    })
  })

  f.Rule('Food-choice deadline', (r) => {
    r.RuleScenario('Revisit before food deadline', (s) => {
      let wrapper: Wrapper
      let choices: CourseFields
      s.Given('a party revisiting the food-choice page before its deadline', () => {
        choices = fullChoices()
      })
      s.When('the page loads', async () => {
        wrapper = await mountMenu(foodData({
          guests: [guest(1, 'Alice Smith', { ...choices, dietaryNotes: 'no nuts' })],
        }))
      })
      s.Then('the form is pre-filled with their current choices and can be resubmitted', async () => {
        for (const course of menu.courses) {
          const select = wrapper.find(`select[name="meal-${course.id}-1"]`)
          expect((select.element as HTMLSelectElement).value).toBe(choices[COURSE_FIELDS[course.id]])
        }
        expect((wrapper.find('textarea[name="dietary-1"]').element as HTMLTextAreaElement).value).toBe('no nuts')
        await wrapper.find('form').trigger('submit')
        await new Promise(resolve => setTimeout(resolve, 10))
        expect(posted).toMatchObject({ guests: [{ id: 1, ...choices }] })
      })
    })

    r.RuleScenario('After food deadline', (s) => {
      let wrapper: Wrapper
      s.Given('a party opening the food-choice page after its deadline', () => {})
      s.When('the page loads', async () => {
        wrapper = await mountMenu(foodData({
          locked: true,
          deadline: '2020-01-01T00:00:00Z',
          guests: [guest(1, 'Alice Smith', { ...fullChoices() })],
        }))
      })
      s.Then('a read-only summary of their choices is shown', () => {
        expect(wrapper.find('form').exists()).toBe(false)
        const html = wrapper.html()
        expect(html).toContain('Alice Smith')
        const firstMain = menu.courses.find(course => course.id === 'main')!.options[0]!
        expect(html).toContain(firstMain.name)
      })
    })

    r.RuleScenario('Post-deadline submission blocked server-side', (s) => {
      let db: TestDb
      let ids: { partyId: number, guestId: number }
      let result: { ok: boolean }
      s.Given('a food-choice submission arriving after the food deadline', async () => {
        const seeded = await openFoodDb('2020-01-01T00:00:00Z')
        db = seeded.db
        ids = { partyId: seeded.partyId, guestId: seeded.guestId }
      })
      s.When('the server processes it', async () => {
        const { saveFood } = await import('../../server/utils/food')
        result = await saveFood(db, ids.partyId, {
          guests: [{ id: ids.guestId, ...fullChoices() }],
        })
      })
      s.Then('it is rejected regardless of client state', async () => {
        expect(result.ok).toBe(false)
        expect((await storedGuest(db, ids.guestId)).mainChoiceId).toBeNull()
      })
    })
  })
})
