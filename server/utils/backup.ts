import { guests, parties, settings } from '../db/schema'
import type { Db } from './db'

export interface DatabaseDump {
  parties: typeof parties.$inferSelect[]
  guests: typeof guests.$inferSelect[]
  settings: typeof settings.$inferSelect[]
}

export async function dumpDatabase(db: Db): Promise<DatabaseDump> {
  return {
    parties: await db.select().from(parties),
    guests: await db.select().from(guests),
    settings: await db.select().from(settings),
  }
}

/** Rebuild all tables from a dump — replaces existing contents. */
export async function restoreDatabase(db: Db, dump: DatabaseDump) {
  await db.delete(guests)
  await db.delete(parties)
  await db.delete(settings)
  if (dump.parties.length) await db.insert(parties).values(dump.parties)
  if (dump.guests.length) await db.insert(guests).values(dump.guests)
  if (dump.settings.length) await db.insert(settings).values(dump.settings)
}
