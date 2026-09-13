import { guests, parties, payments, roomRequests, saveTheDateResponses, settings } from '../db/schema'
import type { Db } from './db'

export interface DatabaseDump {
  parties: typeof parties.$inferSelect[]
  guests: typeof guests.$inferSelect[]
  settings: typeof settings.$inferSelect[]
  saveTheDateResponses: typeof saveTheDateResponses.$inferSelect[]
  roomRequests: typeof roomRequests.$inferSelect[]
  payments: typeof payments.$inferSelect[]
}

export async function dumpDatabase(db: Db): Promise<DatabaseDump> {
  return {
    parties: await db.select().from(parties),
    guests: await db.select().from(guests),
    settings: await db.select().from(settings),
    saveTheDateResponses: await db.select().from(saveTheDateResponses),
    roomRequests: await db.select().from(roomRequests),
    payments: await db.select().from(payments),
  }
}

/** Rebuild all tables from a dump — replaces existing contents. */
export async function restoreDatabase(db: Db, dump: DatabaseDump) {
  await db.delete(guests)
  await db.delete(roomRequests)
  await db.delete(payments)
  await db.delete(parties)
  await db.delete(settings)
  await db.delete(saveTheDateResponses)
  if (dump.parties.length) await db.insert(parties).values(dump.parties)
  if (dump.guests.length) await db.insert(guests).values(dump.guests)
  if (dump.roomRequests?.length) await db.insert(roomRequests).values(dump.roomRequests)
  if (dump.payments?.length) await db.insert(payments).values(dump.payments)
  if (dump.settings.length) await db.insert(settings).values(dump.settings)
  // older dumps predate this table
  if (dump.saveTheDateResponses?.length) await db.insert(saveTheDateResponses).values(dump.saveTheDateResponses)
}
