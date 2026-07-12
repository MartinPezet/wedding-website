import { eq } from 'drizzle-orm'
import { normalisePhone } from '../../../../shared/utils/phone'
import { guests, parties } from '../../../db/schema'

interface GuestEdit {
  id?: number
  name: string
  isChild?: boolean
  phone?: string | null
}

// Party rename + guest sync: update by id, insert without id, delete omitted
// (the UI confirms guest removal before sending).
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = useDb()
  const party = await db.query.parties.findFirst({ where: eq(parties.id, id), with: { guests: true } })
  if (!party) throw createError({ statusCode: 404, message: 'Party not found.' })

  const body = await readBody<{ name?: string, guests?: GuestEdit[] }>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : party.name
  if (!name) throw createError({ statusCode: 400, message: 'A party needs a name.' })
  await db.update(parties).set({ name, updatedAt: new Date().toISOString() }).where(eq(parties.id, id))

  if (Array.isArray(body?.guests)) {
    if (body.guests.length === 0 || body.guests.some(guest => typeof guest.name !== 'string' || !guest.name.trim())) {
      throw createError({ statusCode: 400, message: 'A party needs at least one named guest.' })
    }
    const phones = new Map<GuestEdit, string | null>()
    for (const guest of body.guests) {
      const phone = guest.phone ? normalisePhone(guest.phone) : null
      if (guest.phone && !phone) {
        throw createError({ statusCode: 400, message: `Invalid phone number for ${guest.name}.` })
      }
      phones.set(guest, phone)
    }
    const keptIds = new Set(body.guests.map(guest => guest.id).filter(Boolean))
    for (const existing of party.guests) {
      if (!keptIds.has(existing.id)) await db.delete(guests).where(eq(guests.id, existing.id))
    }
    for (const [index, guest] of body.guests.entries()) {
      const fields = {
        name: guest.name.trim(),
        isChild: Boolean(guest.isChild),
        phone: phones.get(guest) ?? null,
        sortOrder: index,
      }
      if (guest.id) {
        await db.update(guests).set(fields).where(eq(guests.id, guest.id))
      }
      else {
        await db.insert(guests).values({ ...fields, partyId: id })
      }
    }
  }
  return { ok: true }
})
