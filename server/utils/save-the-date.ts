import { desc } from 'drizzle-orm'
import type { SaveTheDateInput } from '#shared/utils/save-the-date'
import { validateSaveTheDate } from '#shared/utils/save-the-date'
import { saveTheDateResponses } from '../db/schema'
import type { Db } from './db'

export type SaveResponseResult = { ok: true } | { ok: false, error: string }

/**
 * Store one save-the-date response. Phone is the identity: resubmitting the same
 * number updates that household rather than adding a second row.
 */
export async function saveResponse(db: Db, input: SaveTheDateInput): Promise<SaveResponseResult> {
  const result = validateSaveTheDate(input ?? {})
  if (!result.ok) return result

  const now = new Date().toISOString()
  const { value } = result
  await db.insert(saveTheDateResponses)
    .values({ ...value, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: saveTheDateResponses.phone,
      set: {
        name: value.name,
        addressLine1: value.addressLine1,
        addressLine2: value.addressLine2,
        city: value.city,
        postcode: value.postcode,
        country: value.country,
        stayNightBefore: value.stayNightBefore,
        stayNightOf: value.stayNightOf,
        updatedAt: now,
      },
    })
  return { ok: true }
}

export async function listResponses(db: Db) {
  return db.select().from(saveTheDateResponses).orderBy(desc(saveTheDateResponses.createdAt), desc(saveTheDateResponses.id))
}
