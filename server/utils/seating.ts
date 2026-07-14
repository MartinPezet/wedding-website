import { asc, eq, inArray, isNotNull, or } from 'drizzle-orm'
import { createError } from 'h3'
import type { TableShape } from '../../shared/utils/seating'
import { guests, parties, tables } from '../db/schema'
import type { Db } from './db'

const SHAPES: TableShape[] = ['round', 'rect']
const MAX_CAPACITY = 24

export interface TableInput {
  name: string
  shape: TableShape
  capacity: number
  x?: number
  y?: number
}

export interface TablePatch {
  id: number
  name?: string
  shape?: TableShape
  capacity?: number
  x?: number
  y?: number
}

export interface SeatAssignment {
  guestId: number
  /** null unassigns (seatIndex ignored) */
  tableId: number | null
  seatIndex?: number | null
}

export interface SeatingPatch {
  tables?: TablePatch[]
  assignments?: SeatAssignment[]
  /** table ids to delete; their guests are unassigned first */
  deleteTables?: number[]
}

function validateCapacity(capacity: number) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
    throw createError({ statusCode: 400, message: `Capacity must be 1–${MAX_CAPACITY}.` })
  }
}

function validateShape(shape: string): asserts shape is TableShape {
  if (!SHAPES.includes(shape as TableShape)) {
    throw createError({ statusCode: 400, message: 'Shape must be round or rect.' })
  }
}

export async function getSeatingData(db: Db) {
  const tableRows = await db.select().from(tables).orderBy(asc(tables.sortOrder), asc(tables.id))
  // sidebar shows attending guests; seated non-attenders surface as orphans
  const guestRows = await db.select({
    id: guests.id,
    name: guests.name,
    isChild: guests.isChild,
    attending: guests.attending,
    partyId: guests.partyId,
    partyName: parties.name,
    starterChoiceId: guests.starterChoiceId,
    mainChoiceId: guests.mainChoiceId,
    dessertChoiceId: guests.dessertChoiceId,
    dietaryNotes: guests.dietaryNotes,
    tableId: guests.tableId,
    seatIndex: guests.seatIndex,
  })
    .from(guests)
    .innerJoin(parties, eq(guests.partyId, parties.id))
    .where(or(eq(guests.attending, true), isNotNull(guests.tableId)))
    .orderBy(asc(parties.name), asc(guests.sortOrder))
  return { tables: tableRows, guests: guestRows }
}

export type SeatingData = Awaited<ReturnType<typeof getSeatingData>>
export type SeatingTable = SeatingData['tables'][number]
export type SeatingGuest = SeatingData['guests'][number]

export async function createTable(db: Db, input: TableInput) {
  const name = input.name?.trim()
  if (!name) throw createError({ statusCode: 400, message: 'A table needs a name.' })
  validateShape(input.shape)
  validateCapacity(input.capacity)
  const existing = await db.select({ sortOrder: tables.sortOrder }).from(tables)
  const sortOrder = existing.length ? Math.max(...existing.map(row => row.sortOrder)) + 1 : 0
  const [row] = await db.insert(tables).values({
    name,
    shape: input.shape,
    capacity: input.capacity,
    x: input.x ?? 0,
    y: input.y ?? 0,
    sortOrder,
  }).returning()
  return row!
}

export async function applySeatingPatch(db: Db, patch: SeatingPatch) {
  for (const tablePatch of patch.tables ?? []) {
    if (!Number.isInteger(tablePatch.id)) throw createError({ statusCode: 400, message: 'Invalid table id.' })
    const fields: Partial<typeof tables.$inferInsert> = {}
    if (tablePatch.name !== undefined) {
      const name = tablePatch.name.trim()
      if (!name) throw createError({ statusCode: 400, message: 'A table needs a name.' })
      fields.name = name
    }
    if (tablePatch.shape !== undefined) {
      validateShape(tablePatch.shape)
      fields.shape = tablePatch.shape
    }
    if (tablePatch.capacity !== undefined) {
      validateCapacity(tablePatch.capacity)
      fields.capacity = tablePatch.capacity
    }
    if (tablePatch.x !== undefined) fields.x = Number(tablePatch.x)
    if (tablePatch.y !== undefined) fields.y = Number(tablePatch.y)
    if (Object.keys(fields).length === 0) continue
    const updated = await db.update(tables).set(fields).where(eq(tables.id, tablePatch.id)).returning()
    if (!updated.length) throw createError({ statusCode: 404, message: 'Table not found.' })
  }

  for (const assignment of patch.assignments ?? []) {
    if (!Number.isInteger(assignment.guestId)) throw createError({ statusCode: 400, message: 'Invalid guest id.' })
    if (assignment.tableId === null) {
      const updated = await db.update(guests).set({ tableId: null, seatIndex: null })
        .where(eq(guests.id, assignment.guestId)).returning()
      if (!updated.length) throw createError({ statusCode: 404, message: 'Guest not found.' })
      continue
    }
    const table = await db.query.tables.findFirst({ where: eq(tables.id, assignment.tableId) })
    if (!table) throw createError({ statusCode: 404, message: 'Table not found.' })
    const seatIndex = assignment.seatIndex
    if (!Number.isInteger(seatIndex) || seatIndex! < 0 || seatIndex! >= table.capacity) {
      throw createError({ statusCode: 400, message: 'Seat index out of range for that table.' })
    }
    const updated = await db.update(guests).set({ tableId: assignment.tableId, seatIndex })
      .where(eq(guests.id, assignment.guestId)).returning()
    if (!updated.length) throw createError({ statusCode: 404, message: 'Guest not found.' })
  }

  for (const tableId of patch.deleteTables ?? []) {
    if (!Number.isInteger(tableId)) throw createError({ statusCode: 400, message: 'Invalid table id.' })
    await deleteTable(db, tableId)
  }
  return { ok: true as const }
}

export async function deleteTable(db: Db, tableId: number) {
  const seated = await db.select({ id: guests.id }).from(guests).where(eq(guests.tableId, tableId))
  if (seated.length) {
    await db.update(guests).set({ tableId: null, seatIndex: null })
      .where(inArray(guests.id, seated.map(row => row.id)))
  }
  const deleted = await db.delete(tables).where(eq(tables.id, tableId)).returning()
  if (!deleted.length) throw createError({ statusCode: 404, message: 'Table not found.' })
  return { ok: true as const }
}
