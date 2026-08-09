import { desc, eq, ne, and } from 'drizzle-orm'
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

/**
 * Admin correction of one stored response, by id rather than by phone —
 * unlike saveResponse, this may change the phone itself.
 */
export async function updateResponse(db: Db, id: number, input: SaveTheDateInput): Promise<SaveResponseResult> {
  const result = validateSaveTheDate(input ?? {})
  if (!result.ok) return result

  const { value } = result
  const clash = await db.query.saveTheDateResponses.findFirst({
    where: and(eq(saveTheDateResponses.phone, value.phone), ne(saveTheDateResponses.id, id)),
  })
  if (clash) return { ok: false, error: 'Another response already uses that phone number.' }

  await db.update(saveTheDateResponses)
    .set({ ...value, updatedAt: new Date().toISOString() })
    .where(eq(saveTheDateResponses.id, id))
  return { ok: true }
}

export async function deleteResponse(db: Db, id: number) {
  await db.delete(saveTheDateResponses).where(eq(saveTheDateResponses.id, id))
}
