import { guests, parties, saveTheDateResponses, settings } from '../db/schema'
import type { Db } from './db'

export interface DatabaseDump {
  parties: typeof parties.$inferSelect[]
  guests: typeof guests.$inferSelect[]
  settings: typeof settings.$inferSelect[]
  saveTheDateResponses: typeof saveTheDateResponses.$inferSelect[]
}

export async function dumpDatabase(db: Db): Promise<DatabaseDump> {
  return {
    parties: await db.select().from(parties),
    guests: await db.select().from(guests),
    settings: await db.select().from(settings),
    saveTheDateResponses: await db.select().from(saveTheDateResponses),
  }
}

/** Rebuild all tables from a dump — replaces existing contents. */
export async function restoreDatabase(db: Db, dump: DatabaseDump) {
  await db.delete(guests)
  await db.delete(parties)
  await db.delete(settings)
  await db.delete(saveTheDateResponses)
  if (dump.parties.length) await db.insert(parties).values(dump.parties)
  if (dump.guests.length) await db.insert(guests).values(dump.guests)
  if (dump.settings.length) await db.insert(settings).values(dump.settings)
  // older dumps predate this table
  if (dump.saveTheDateResponses?.length) await db.insert(saveTheDateResponses).values(dump.saveTheDateResponses)
}
