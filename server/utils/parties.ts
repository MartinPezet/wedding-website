import { normalisePhone } from '#shared/utils/phone'
import { guests, parties } from '../db/schema'
import type { Db } from './db'
import { generatePartyToken } from './token'

export interface NewParty {
  name: string
  guests: { name: string, isChild?: boolean, phone?: string }[]
}

const TOKEN_INSERT_ATTEMPTS = 5

function isTokenCollision(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  if ('extendedCode' in err && (err as { extendedCode?: string }).extendedCode === 'SQLITE_CONSTRAINT_UNIQUE') return true
  return 'cause' in err && isTokenCollision((err as { cause?: unknown }).cause)
}

async function insertPartyWithToken(db: Db, name: string) {
  for (let attempt = 1; attempt <= TOKEN_INSERT_ATTEMPTS; attempt++) {
    try {
      const [party] = await db.insert(parties)
        .values({ name, token: generatePartyToken() })
        .returning()
      return party!
    }
    catch (err) {
      if (attempt === TOKEN_INSERT_ATTEMPTS || !isTokenCollision(err)) throw err
    }
  }
  throw new Error('unreachable')
}

export async function createParty(db: Db, input: NewParty) {
  const party = await insertPartyWithToken(db, input.name)
  if (input.guests.length) {
    await db.insert(guests).values(input.guests.map((guest, index) => ({
      partyId: party.id,
      name: guest.name,
      isChild: guest.isChild ?? false,
      sortOrder: index,
      phone: guest.phone ? normalisePhone(guest.phone) : null,
    })))
  }
  return party
}
