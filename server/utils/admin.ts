import { asc, eq } from 'drizzle-orm'
import { menu } from '#shared/content'
import type { RoomChoice, RoomNight } from '#shared/content'
import { COURSE_FIELDS } from '#shared/utils/menu'
import { ROOM_CHOICES, ROOM_NIGHTS, roomTotal } from '#shared/utils/rooms'
import { guests, parties, roomRequests, settings } from '../db/schema'
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
  /** rooms requested, one entry per night/choice pairing */
  roomTotals: { night: RoomNight, choice: RoomChoice, count: number }[]
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
  const allRooms = await db.select().from(roomRequests)
  const roomTotals = ROOM_NIGHTS.flatMap(night =>
    ROOM_CHOICES.map(choice => ({
      night,
      choice,
      count: allRooms.filter(room => room.night === night && room.choice === choice).length,
    })),
  )
  return {
    invited: allGuests.length,
    responded: allParties.filter(party => party.respondedAt).length,
    outstanding: allParties.filter(party => !party.respondedAt).length,
    attending: allGuests.filter(guest => guest.attending === true).length,
    declined: allGuests.filter(guest => guest.attending === false).length,
    mealTotals,
    roomTotals,
  }
}

export async function getPartyList(db: Db) {
  const rows = await db.query.parties.findMany({
    with: { guests: { orderBy: asc(guests.sortOrder) }, roomRequests: true },
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
    rooms: party.roomRequests.toSorted((a, b) => a.sortOrder - b.sortOrder),
    amountPaid: party.amountPaid,
    /** what this party owes for its rooms, priced from the shared rates */
    roomTotal: roomTotal(party.roomRequests),
  }))
}

export async function setAmountPaid(db: Db, partyId: number, amount: number) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw createError({ statusCode: 400, message: 'Amount paid must be zero or more.' })
  }
  await db.update(parties).set({ amountPaid: amount }).where(eq(parties.id, partyId))
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
  foodDeadline?: string
  paymentDeadline?: string
  /** the food-choice page shows closed-state copy until this is on */
  foodChoiceOpen?: boolean
}

export const DATE_SETTING_KEYS = {
  weddingDate: 'wedding_date',
  rsvpDeadline: 'rsvp_deadline',
  foodDeadline: 'food_deadline',
  paymentDeadline: 'payment_deadline',
} as const

export type AdminDateSetting = keyof typeof DATE_SETTING_KEYS

const FOOD_CHOICE_OPEN_KEY = 'food_choice_open'

export async function getAdminSettings(db: Db): Promise<AdminSettings> {
  const rows = await db.select().from(settings)
  const byKey = new Map(rows.map(row => [row.key, row.value]))
  const dates = Object.fromEntries(
    Object.entries(DATE_SETTING_KEYS).map(([field, key]) => [field, byKey.get(key)]),
  ) as Record<AdminDateSetting, string | undefined>
  return { ...dates, foodChoiceOpen: byKey.get(FOOD_CHOICE_OPEN_KEY) === 'true' }
}

export async function saveSettings(db: Db, input: AdminSettings) {
  const entries: [string, string][] = Object.entries(DATE_SETTING_KEYS)
    .flatMap(([field, key]) => {
      const value = input[field as AdminDateSetting]
      return value === undefined ? [] : [[key, value] as [string, string]]
    })
  if (input.foodChoiceOpen !== undefined) {
    entries.push([FOOD_CHOICE_OPEN_KEY, String(input.foodChoiceOpen)])
  }
  for (const [key, value] of entries) {
    await db.insert(settings).values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }
}
