import { normalisePhone } from '../../shared/utils/phone'
import { guests, parties } from '../db/schema'
import type { Db } from './db'
import { generatePartyToken } from './token'

export interface NewParty {
  name: string
  guests: { name: string, isChild?: boolean, phone?: string }[]
}

export async function createParty(db: Db, input: NewParty) {
  const [party] = await db.insert(parties)
    .values({ name: input.name, token: generatePartyToken() })
    .returning()
  if (input.guests.length) {
    await db.insert(guests).values(input.guests.map((guest, index) => ({
      partyId: party!.id,
      name: guest.name,
      isChild: guest.isChild ?? false,
      sortOrder: index,
      phone: guest.phone ? normalisePhone(guest.phone) : null,
    })))
  }
  return party!
}
