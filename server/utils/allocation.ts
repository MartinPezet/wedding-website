import { asc, eq, inArray, or, sql } from 'drizzle-orm'
import type { RoomNight } from '#shared/content'
import { ROOM_NIGHTS } from '#shared/utils/rooms'
import { guests, parties, roomRequests } from '../db/schema'
import type { Db } from './db'

export type PairResult = { ok: true } | { ok: false, error: string }

/** Put two "match us with another guest" requests for the same night in one room. */
export async function pairRooms(db: Db, firstId: number, secondId: number): Promise<PairResult> {
  if (firstId === secondId) return { ok: false, error: 'Choose two different requests to pair.' }
  const rows = await db.select().from(roomRequests).where(inArray(roomRequests.id, [firstId, secondId]))
  const first = rows.find(row => row.id === firstId)
  const second = rows.find(row => row.id === secondId)
  if (!first || !second) return { ok: false, error: 'Room request not found.' }
  if (first.choice !== 'share_match' || second.choice !== 'share_match') {
    return { ok: false, error: 'Only "match us with another guest" requests can be paired.' }
  }
  if (first.night !== second.night) return { ok: false, error: 'Only requests for the same night can share a room.' }
  if (first.pairedWithId || second.pairedWithId) return { ok: false, error: 'One of these requests already has a partner.' }

  // one statement, so a pair is never left half-recorded
  await db.update(roomRequests)
    .set({ pairedWithId: sql`CASE ${roomRequests.id} WHEN ${first.id} THEN ${second.id} ELSE ${first.id} END` })
    .where(inArray(roomRequests.id, [first.id, second.id]))
  return { ok: true }
}

/** Clears the pairing from both sides. */
export async function unpairRooms(db: Db, id: number) {
  await db.update(roomRequests)
    .set({ pairedWithId: null })
    .where(or(eq(roomRequests.id, id), eq(roomRequests.pairedWithId, id)))
}

export interface RoomingRoom {
  night: RoomNight
  kind: 'own' | 'named_share' | 'paired' | 'awaiting_partner'
  /** the room requests making up this room — two for a paired share */
  requestIds: number[]
  occupants: string[]
  parties: string[]
}

/**
 * Every booked room for both nights, computed from the requests so it can never
 * drift from them. Requests don't say which guest sleeps where, so a party's
 * attending guests are dealt across its rooms for a night in booking order.
 */
export async function roomingView(db: Db): Promise<RoomingRoom[]> {
  const allParties = await db.query.parties.findMany({
    with: { guests: { orderBy: asc(guests.sortOrder) }, roomRequests: true },
    orderBy: asc(parties.name),
  })

  const seated = new Map<number, { party: string, names: string[], request: typeof roomRequests.$inferSelect }>()
  for (const party of allParties) {
    const names = party.guests.filter(guest => guest.attending !== false).map(guest => guest.name)
    for (const night of ROOM_NIGHTS) {
      let next = 0
      const requests = party.roomRequests
        .filter(request => request.night === night)
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
      for (const request of requests) {
        const count = request.choice === 'our_room' ? request.occupants : 1
        const occupants = Array.from({ length: count }, (_, index) => names[next + index] ?? `${party.name} guest`)
        next += count
        seated.set(request.id, { party: party.name, names: occupants, request })
      }
    }
  }

  const rooms: RoomingRoom[] = []
  for (const { party, names, request } of seated.values()) {
    const room = { night: request.night, requestIds: [request.id], occupants: names, parties: [party] }
    if (request.choice === 'our_room') {
      rooms.push({ ...room, kind: 'own' })
    }
    else if (request.choice === 'share_named') {
      rooms.push({ ...room, kind: 'named_share', occupants: [...names, request.shareWith ?? ''] })
    }
    else {
      const partner = request.pairedWithId ? seated.get(request.pairedWithId) : undefined
      if (!partner) {
        rooms.push({ ...room, kind: 'awaiting_partner' })
      }
      // both rows of a pair land here; emit the room once
      else if (request.id < partner.request.id) {
        rooms.push({
          night: request.night,
          kind: 'paired',
          requestIds: [request.id, partner.request.id],
          occupants: [...names, ...partner.names],
          parties: [...new Set([party, partner.party])],
        })
      }
    }
  }
  return rooms.toSorted((a, b) => ROOM_NIGHTS.indexOf(a.night) - ROOM_NIGHTS.indexOf(b.night))
}
