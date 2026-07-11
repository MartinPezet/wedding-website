import { eq } from 'drizzle-orm'
import { menu } from '../../shared/content'
import { normalisePhone } from '../../shared/utils/phone'
import { guests, parties, settings } from '../db/schema'
import type { Db } from './db'

export interface RsvpSubmission {
  phone: string
  songRequest?: string
  noteToCouple?: string
  guests: {
    id: number
    attending: boolean
    mealChoiceId?: string
    dietaryNotes?: string
  }[]
}

export type RsvpResult = { ok: true } | { ok: false, error: string }

const MAX_TEXT = 500

export async function getDeadline(db: Db): Promise<string | undefined> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, 'rsvp_deadline') })
  return row?.value
}

export async function saveRsvp(db: Db, partyId: number, submission: RsvpSubmission): Promise<RsvpResult> {
  const deadline = await getDeadline(db)
  if (deadline && Date.now() > Date.parse(deadline)) {
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

  const phone = typeof submission.phone === 'string' ? normalisePhone(submission.phone) : null
  if (!phone) {
    return { ok: false, error: 'Please provide a valid contact phone number.' }
  }

  const ownGuests = await db.query.guests.findMany({ where: eq(guests.partyId, partyId) })
  const ownById = new Map(ownGuests.map(guest => [guest.id, guest]))
  for (const answer of submission.guests) {
    const own = ownById.get(answer.id)
    if (!own) {
      return { ok: false, error: 'Unknown guest in submission.' }
    }
    if (answer.attending) {
      const allowed = own.isChild && menu.childMenu?.length ? menu.childMenu : menu.options
      if (!allowed.some(option => option.id === answer.mealChoiceId)) {
        return { ok: false, error: `Please choose a meal for ${own.name}.` }
      }
    }
  }

  const now = new Date().toISOString()
  const leadGuestId = ownGuests.toSorted((a, b) => a.sortOrder - b.sortOrder)[0]?.id
  for (const answer of submission.guests) {
    await db.update(guests).set({
      attending: answer.attending,
      mealChoiceId: answer.attending ? answer.mealChoiceId : null,
      dietaryNotes: answer.dietaryNotes ?? null,
      phone: answer.id === leadGuestId ? phone : undefined,
    }).where(eq(guests.id, answer.id))
  }
  await db.update(parties).set({
    songRequest: submission.songRequest ?? null,
    noteToCouple: submission.noteToCouple ?? null,
    respondedAt: now,
    updatedAt: now,
  }).where(eq(parties.id, partyId))

  return { ok: true }
}
