import { eq } from 'drizzle-orm'
import { parties } from '../db/schema'
import { getDeadline } from '../utils/rsvp'

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
  if (!party) return { party: null, guests: [], phone: null, deadline: null, locked: false }

  const deadline = await getDeadline(db)
  return {
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
      starterChoiceId: guest.starterChoiceId,
      mainChoiceId: guest.mainChoiceId,
      dessertChoiceId: guest.dessertChoiceId,
      dietaryNotes: guest.dietaryNotes,
    })),
    phone: party.guests[0]?.phone ?? null,
    deadline: deadline ?? null,
    locked: Boolean(deadline && Date.now() > Date.parse(deadline)),
  }
})
