import { eq } from 'drizzle-orm'
import { menu as contentMenu } from '#shared/content'
import type { Menu } from '#shared/content'
import { COURSE_FIELDS, optionsFor } from '#shared/utils/menu'
import { normalisePhone } from '#shared/utils/phone'
import { guests, parties, settings } from '../db/schema'
import type { Db } from './db'

export interface RsvpSubmission {
  phone: string
  songRequest?: string
  noteToCouple?: string
  guests: {
    id: number
    attending: boolean
    starterChoiceId?: string | null
    mainChoiceId?: string | null
    dessertChoiceId?: string | null
    dietaryNotes?: string
  }[]
}

export type RsvpResult = { ok: true } | { ok: false, error: string }

const MAX_TEXT = 500

export async function getDeadline(db: Db): Promise<string | undefined> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, 'rsvp_deadline') })
  return row?.value
}

export interface SaveRsvpOptions {
  /** admin edits bypass the deadline lock and make the phone optional */
  admin?: boolean
  /** menu override for tests exercising absent courses; defaults to the real content */
  menu?: Menu
}

export async function saveRsvp(db: Db, partyId: number, submission: RsvpSubmission, options: SaveRsvpOptions = {}): Promise<RsvpResult> {
  const deadline = await getDeadline(db)
  if (!options.admin && deadline && Date.now() > Date.parse(deadline)) {
    return { ok: false, error: 'The RSVP deadline has passed — please contact us to make changes.' }
  }

  if (!Array.isArray(submission.guests) || submission.guests.length === 0) {
    return { ok: false, error: 'No guest responses in submission.' }
  }
  for (const text of [submission.songRequest, submission.noteToCouple, ...submission.guests.map(guest => guest.dietaryNotes)]) {
    if (text !== undefined && (typeof text !== 'string' || text.length > MAX_TEXT)) {
      return { ok: false, error: 'One of the answers is too long.' }
    }
  }

  // phone is required only when someone is attending; a provided one must always be valid
  const rawPhone = typeof submission.phone === 'string' ? submission.phone.trim() : ''
  const phone = rawPhone ? normalisePhone(rawPhone) : null
  if (rawPhone && !phone) {
    return { ok: false, error: 'Please provide a valid contact phone number.' }
  }
  const anyAttending = submission.guests.some(guest => guest.attending)
  if (!rawPhone && anyAttending && !options.admin) {
    return { ok: false, error: 'Please provide a valid contact phone number.' }
  }

  const menu = options.menu ?? contentMenu
  const ownGuests = await db.query.guests.findMany({ where: eq(guests.partyId, partyId) })
  const ownById = new Map(ownGuests.map(guest => [guest.id, guest]))
  for (const answer of submission.guests) {
    const own = ownById.get(answer.id)
    if (!own) {
      return { ok: false, error: 'Unknown guest in submission.' }
    }
    if (answer.attending) {
      // one valid choice per defined course; absent courses are neither required nor stored
      for (const course of menu.courses) {
        const allowed = optionsFor(course, own.isChild)
        if (!allowed.some(option => option.id === answer[COURSE_FIELDS[course.id]])) {
          return { ok: false, error: `Please choose a ${course.name.toLowerCase()} for ${own.name}.` }
        }
      }
    }
  }

  const definedFields = new Set(menu.courses.map(course => COURSE_FIELDS[course.id]))
  const now = new Date().toISOString()
  const leadGuestId = ownGuests.toSorted((a, b) => a.sortOrder - b.sortOrder)[0]?.id
  for (const answer of submission.guests) {
    const choices = Object.fromEntries(
      Object.values(COURSE_FIELDS).map(field => [
        field,
        answer.attending && definedFields.has(field) ? answer[field] : null,
      ]),
    )
    await db.update(guests).set({
      attending: answer.attending,
      ...choices,
      dietaryNotes: answer.dietaryNotes ?? null,
      phone: answer.id === leadGuestId && phone ? phone : undefined,
    }).where(eq(guests.id, answer.id))
  }
  const party = await db.query.parties.findFirst({ where: eq(parties.id, partyId) })
  await db.update(parties).set({
    songRequest: submission.songRequest ?? party?.songRequest ?? null,
    noteToCouple: submission.noteToCouple ?? party?.noteToCouple ?? null,
    // an admin edit of a silent party records the response; guest submits always do
    respondedAt: party?.respondedAt ?? now,
    updatedAt: now,
  }).where(eq(parties.id, partyId))

  return { ok: true }
}
