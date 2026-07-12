import { eq } from 'drizzle-orm'
import { guests, parties } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()
  await db.delete(guests).where(eq(guests.partyId, id))
  await db.delete(parties).where(eq(parties.id, id))
  return { ok: true }
})
