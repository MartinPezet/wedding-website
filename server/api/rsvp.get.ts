import { eq } from 'drizzle-orm'
import { parties } from '../db/schema'
import { getDeadline, getPaymentDeadline, getRoomRequests } from '../utils/rsvp'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Please sign in first.' })
  }
  const partyId = session.partyId
  const db = useDb()
  const party = partyId
    ? await db.query.parties.findFirst({
        where: eq(parties.id, partyId),
        with: { guests: { orderBy: (guests, { asc }) => asc(guests.sortOrder) } },
      })
    : undefined
  if (!party) {
    return { partyId: null, party: null, guests: [], rooms: [], phone: null, deadline: null, paymentDeadline: null, locked: false }
  }

  const deadline = await getDeadline(db)
  return {
    partyId: party.id,
    party: {
      name: party.name,
      songRequest: party.songRequest,
      noteToCouple: party.noteToCouple,
      respondedAt: party.respondedAt,
    },
    guests: party.guests.map(guest => ({
      id: guest.id,
      name: guest.name,
      isChild: guest.isChild,
      attending: guest.attending,
    })),
    rooms: (await getRoomRequests(db, party.id)).map(room => ({
      night: room.night,
      choice: room.choice,
      shareWith: room.shareWith,
      occupants: room.occupants,
    })),
    phone: party.guests[0]?.phone ?? null,
    deadline: deadline ?? null,
    paymentDeadline: await getPaymentDeadline(db) ?? null,
    locked: Boolean(deadline && Date.now() > Date.parse(deadline)),
  }
})
