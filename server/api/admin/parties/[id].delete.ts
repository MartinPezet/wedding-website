import { eq } from 'drizzle-orm'
import { guests, parties, payments, roomRequests } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()
  await db.delete(guests).where(eq(guests.partyId, id))
  await db.delete(payments).where(eq(payments.partyId, id))
  await db.delete(roomRequests).where(eq(roomRequests.partyId, id))
  await db.delete(parties).where(eq(parties.id, id))
  return { ok: true }
})
