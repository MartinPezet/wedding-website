import { eq } from 'drizzle-orm'
import type { RoomChoice, RoomNight } from '#shared/content'
import { ROOM_CHOICES, ROOM_NIGHTS } from '#shared/utils/rooms'
import { normalisePhone } from '#shared/utils/phone'
import { guests, parties, roomRequests, settings } from '../db/schema'
import type { Db } from './db'

export interface RoomSubmission {
  night: RoomNight
  choice: RoomChoice
  /** required for share_named, ignored otherwise */
  shareWith?: string | null
  /** own guests in the room; only meaningful for our_room */
  occupants?: number
}

export interface RsvpSubmission {
  phone: string
  songRequest?: string
  noteToCouple?: string
  guests: {
    id: number
    attending: boolean
  }[]
  rooms?: RoomSubmission[]
}

export type RsvpResult = { ok: true } | { ok: false, error: string }

const MAX_TEXT = 500
/** one room sleeps at most two of the party's own guests */
const MAX_OCCUPANTS = 2

export async function getDeadline(db: Db): Promise<string | undefined> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, 'rsvp_deadline') })
  return row?.value
}

export async function getPaymentDeadline(db: Db): Promise<string | undefined> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, 'payment_deadline') })
  return row?.value
}

export async function getRoomRequests(db: Db, partyId: number) {
  const rows = await db.select().from(roomRequests).where(eq(roomRequests.partyId, partyId))
  return rows.toSorted((a, b) => a.sortOrder - b.sortOrder)
}

export interface SaveRsvpOptions {
  /** admin edits bypass the deadline lock */
  admin?: boolean
}

/** validated, storable form of the submitted rooms — or the reason they were refused */
type RoomCheck = { ok: true, rooms: typeof roomRequests.$inferInsert[] } | { ok: false, error: string }

function checkRooms(partyId: number, submitted: RsvpSubmission['rooms']): RoomCheck {
  if (submitted === undefined) return { ok: true, rooms: [] }
  if (!Array.isArray(submitted)) return { ok: false, error: 'Room bookings are in an unexpected format.' }

  const rooms: typeof roomRequests.$inferInsert[] = []
  for (const [index, room] of submitted.entries()) {
    if (!ROOM_NIGHTS.includes(room?.night)) {
      return { ok: false, error: 'Please choose which night each room is for.' }
    }
    if (!ROOM_CHOICES.includes(room.choice)) {
      return { ok: false, error: 'Please choose how each room is shared.' }
    }
    const shareWith = typeof room.shareWith === 'string' ? room.shareWith.trim() : ''
    if (room.choice === 'share_named' && !shareWith) {
      return { ok: false, error: 'Please say who you are sharing a room with.' }
    }
    if (shareWith.length > MAX_TEXT) {
      return { ok: false, error: 'One of the answers is too long.' }
    }
    // only an own room sleeps more than the party's one person
    const occupants = room.choice === 'our_room' ? Number(room.occupants ?? 1) : 1
    if (!Number.isInteger(occupants) || occupants < 1 || occupants > MAX_OCCUPANTS) {
      return { ok: false, error: 'A room sleeps one or two of your party.' }
    }
    rooms.push({
      partyId,
      night: room.night,
      choice: room.choice,
      shareWith: room.choice === 'share_named' ? shareWith : null,
      occupants,
      sortOrder: index,
    })
  }
  return { ok: true, rooms }
}

export async function saveRsvp(db: Db, partyId: number, submission: RsvpSubmission, options: SaveRsvpOptions = {}): Promise<RsvpResult> {
  const deadline = await getDeadline(db)
  if (!options.admin && deadline && Date.now() > Date.parse(deadline)) {
    return { ok: false, error: 'The RSVP deadline has passed — please contact us to make changes.' }
  }

  if (!Array.isArray(submission.guests) || submission.guests.length === 0) {
    return { ok: false, error: 'No guest responses in submission.' }
  }
  for (const text of [submission.songRequest, submission.noteToCouple]) {
    if (text !== undefined && (typeof text !== 'string' || text.length > MAX_TEXT)) {
      return { ok: false, error: 'One of the answers is too long.' }
    }
  }

  // the RSVP page never asks for a phone; admin edits may still supply one,
  // and whatever arrives must be a valid number before it is stored
  const rawPhone = typeof submission.phone === 'string' ? submission.phone.trim() : ''
  const phone = rawPhone ? normalisePhone(rawPhone) : null
  if (rawPhone && !phone) {
    return { ok: false, error: 'Please provide a valid contact phone number.' }
  }

  const ownGuests = await db.query.guests.findMany({ where: eq(guests.partyId, partyId) })
  const ownIds = new Set(ownGuests.map(guest => guest.id))
  if (submission.guests.some(answer => !ownIds.has(answer.id))) {
    return { ok: false, error: 'Unknown guest in submission.' }
  }

  const checked = checkRooms(partyId, submission.rooms)
  if (!checked.ok) return checked

  const now = new Date().toISOString()
  const leadGuestId = ownGuests.toSorted((a, b) => a.sortOrder - b.sortOrder)[0]?.id
  for (const answer of submission.guests) {
    // dietary notes belong to the food-choice page — never touched from here
    await db.update(guests).set({
      attending: answer.attending,
      phone: answer.id === leadGuestId && phone ? phone : undefined,
    }).where(eq(guests.id, answer.id))
  }

  // a submit carries the party's whole room set — replace rather than append
  await db.delete(roomRequests).where(eq(roomRequests.partyId, partyId))
  if (checked.rooms.length) {
    await db.insert(roomRequests).values(checked.rooms)
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
