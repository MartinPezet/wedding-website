import { asc, eq } from 'drizzle-orm'
import { menu } from '../../shared/content'
import { COURSE_FIELDS } from '../../shared/utils/menu'
import { guests, parties, settings } from '../db/schema'
import type { Db } from './db'
import { generatePartyToken } from './token'

export interface DashboardStats {
  /** total guests */
  invited: number
  /** parties that have responded */
  responded: number
  /** parties yet to respond */
  outstanding: number
  /** guests attending */
  attending: number
  /** guests declined */
  declined: number
  /** one entry per course defined in menu.json */
  mealTotals: { id: string, name: string, options: { id: string, name: string, count: number }[] }[]
}

export async function getDashboardStats(db: Db): Promise<DashboardStats> {
  // ponytail: ~200 rows total, load and count in JS
  const allParties = await db.select().from(parties)
  const allGuests = await db.select().from(guests)
  const mealTotals = menu.courses.map((course) => {
    const field = COURSE_FIELDS[course.id]
    const counts = new Map<string, number>()
    for (const guest of allGuests) {
      const choice = guest[field]
      if (guest.attending && choice) {
        counts.set(choice, (counts.get(choice) ?? 0) + 1)
      }
    }
    return {
      id: course.id,
      name: course.name,
      options: [...course.options, ...(course.childOptions ?? [])]
        .map(option => ({ id: option.id, name: option.name, count: counts.get(option.id) ?? 0 })),
    }
  })
  return {
    invited: allGuests.length,
    responded: allParties.filter(party => party.respondedAt).length,
    outstanding: allParties.filter(party => !party.respondedAt).length,
    attending: allGuests.filter(guest => guest.attending === true).length,
    declined: allGuests.filter(guest => guest.attending === false).length,
    mealTotals,
  }
}

export async function getPartyList(db: Db) {
  const rows = await db.query.parties.findMany({
    with: { guests: { orderBy: asc(guests.sortOrder) } },
    orderBy: asc(parties.name),
  })
  return rows.map(party => ({
    id: party.id,
    name: party.name,
    token: party.token,
    songRequest: party.songRequest,
    noteToCouple: party.noteToCouple,
    respondedAt: party.respondedAt,
    phone: party.guests[0]?.phone ?? null,
    guests: party.guests,
  }))
}

export async function regeneratePartyToken(db: Db, partyId: number) {
  const [party] = await db.update(parties)
    .set({ token: generatePartyToken() })
    .where(eq(parties.id, partyId))
    .returning()
  if (!party) throw createError({ statusCode: 404, message: 'Party not found.' })
  return party
}

export interface AdminSettings {
  weddingDate?: string
  rsvpDeadline?: string
}

const SETTING_KEYS: Record<keyof AdminSettings, string> = {
  weddingDate: 'wedding_date',
  rsvpDeadline: 'rsvp_deadline',
}

export async function getAdminSettings(db: Db): Promise<AdminSettings> {
  const rows = await db.select().from(settings)
  const byKey = new Map(rows.map(row => [row.key, row.value]))
  return {
    weddingDate: byKey.get(SETTING_KEYS.weddingDate),
    rsvpDeadline: byKey.get(SETTING_KEYS.rsvpDeadline),
  }
}

export async function saveSettings(db: Db, input: AdminSettings) {
  for (const [field, key] of Object.entries(SETTING_KEYS) as [keyof AdminSettings, string][]) {
    const value = input[field]
    if (value === undefined) continue
    await db.insert(settings).values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }
}
