import { normalisePhone } from '../../../shared/utils/phone'
import type { NewParty } from '../../utils/parties'
import { createParty } from '../../utils/parties'

export default defineEventHandler(async (event) => {
  const body = await readBody<NewParty>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const guests = Array.isArray(body?.guests) ? body.guests : []
  if (!name || guests.length === 0 || guests.some(guest => typeof guest.name !== 'string' || !guest.name.trim())) {
    throw createError({ statusCode: 400, message: 'A party needs a name and at least one named guest.' })
  }
  for (const guest of guests) {
    if (guest.phone && !normalisePhone(guest.phone)) {
      throw createError({ statusCode: 400, message: `Invalid phone number for ${guest.name}.` })
    }
  }
  const party = await createParty(useDb(), {
    name,
    guests: guests.map(guest => ({ name: guest.name.trim(), isChild: Boolean(guest.isChild), phone: guest.phone })),
  })
  return { id: party.id, token: party.token }
})
