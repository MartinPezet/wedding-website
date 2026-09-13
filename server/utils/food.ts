import { eq } from 'drizzle-orm'
import { menu as contentMenu } from '#shared/content'
import type { Menu } from '#shared/content'
import { COURSE_FIELDS, optionsFor } from '#shared/utils/menu'
import { guests, parties, settings } from '../db/schema'
import type { Db } from './db'

export interface FoodSubmission {
  guests: {
    id: number
    starterChoiceId?: string | null
    mainChoiceId?: string | null
    dessertChoiceId?: string | null
    dietaryNotes?: string
  }[]
}

export type FoodResult = { ok: true } | { ok: false, error: string }

const MAX_TEXT = 500

export interface FoodSettings {
  /** the admin toggle; the page shows closed-state copy until this is on */
  open: boolean
  deadline?: string
}

export async function getFoodSettings(db: Db): Promise<FoodSettings> {
  const rows = await db.select().from(settings)
  const byKey = new Map(rows.map(row => [row.key, row.value]))
  return {
    open: byKey.get('food_choice_open') === 'true',
    deadline: byKey.get('food_deadline'),
  }
}

export interface SaveFoodOptions {
  /** admin edits bypass the toggle and the deadline lock */
  admin?: boolean
  /** menu override for tests exercising absent courses; defaults to the real content */
  menu?: Menu
}

export async function saveFood(db: Db, partyId: number, submission: FoodSubmission, options: SaveFoodOptions = {}): Promise<FoodResult> {
  const { open, deadline } = await getFoodSettings(db)
  if (!options.admin) {
    if (!open) {
      return { ok: false, error: 'The menu is not ready yet — we will let you know when it is.' }
    }
    if (deadline && Date.now() > Date.parse(deadline)) {
      return { ok: false, error: 'The menu deadline has passed — please contact us to make changes.' }
    }
  }

  if (!Array.isArray(submission.guests) || submission.guests.length === 0) {
    return { ok: false, error: 'No meal choices in submission.' }
  }
  for (const text of submission.guests.map(guest => guest.dietaryNotes)) {
    if (text !== undefined && (typeof text !== 'string' || text.length > MAX_TEXT)) {
      return { ok: false, error: 'One of the answers is too long.' }
    }
  }

  const menu = options.menu ?? contentMenu
  const ownGuests = await db.query.guests.findMany({ where: eq(guests.partyId, partyId) })
  const ownById = new Map(ownGuests.map(guest => [guest.id, guest]))
  for (const answer of submission.guests) {
    const own = ownById.get(answer.id)
    if (!own) {
      return { ok: false, error: 'Unknown guest in submission.' }
    }
    // meals are only ever asked of, and accepted for, guests who are coming
    if (own.attending !== true) {
      return { ok: false, error: `${own.name} is not down as attending — please update your RSVP first.` }
    }
    // one valid choice per defined course; absent courses are neither required nor stored
    for (const course of menu.courses) {
      const allowed = optionsFor(course, own.isChild)
      if (!allowed.some(option => option.id === answer[COURSE_FIELDS[course.id]])) {
        return { ok: false, error: `Please choose a ${course.name.toLowerCase()} for ${own.name}.` }
      }
    }
  }

  const definedFields = new Set(menu.courses.map(course => COURSE_FIELDS[course.id]))
  for (const answer of submission.guests) {
    const choices = Object.fromEntries(
      Object.values(COURSE_FIELDS).map(field => [field, definedFields.has(field) ? answer[field] : null]),
    )
    await db.update(guests).set({
      ...choices,
      dietaryNotes: answer.dietaryNotes ?? null,
    }).where(eq(guests.id, answer.id))
  }
  await db.update(parties)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(parties.id, partyId))

  return { ok: true }
}
