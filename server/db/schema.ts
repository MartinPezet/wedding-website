import { relations } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const tables = sqliteTable('tables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  shape: text('shape', { enum: ['round', 'rect'] }).notNull().default('round'),
  // logical canvas units (1000×700 viewBox), scaled for screen and print
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  capacity: integer('capacity').notNull().default(8),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const parties = sqliteTable('parties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  token: text('token').notNull().unique(),
  songRequest: text('song_request'),
  noteToCouple: text('note_to_couple'),
  respondedAt: text('responded_at'),
  updatedAt: text('updated_at'),
})

export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  partyId: integer('party_id').notNull().references(() => parties.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isChild: integer('is_child', { mode: 'boolean' }).notNull().default(false),
  // party contact number lives on the lead guest (lowest sortOrder), E.164
  phone: text('phone'),
  attending: integer('attending', { mode: 'boolean' }),
  // one choice per course; a course absent from menu.json stays null
  starterChoiceId: text('starter_choice_id'),
  mainChoiceId: text('main_choice_id'),
  dessertChoiceId: text('dessert_choice_id'),
  dietaryNotes: text('dietary_notes'),
  // seating: null = unassigned; seatIndex into seatPositions(shape, capacity)
  tableId: integer('table_id').references(() => tables.id),
  seatIndex: integer('seat_index'),
})

// public save-the-date interest form: households the couple have not yet turned
// into parties. Phone is the identity — a resubmission updates the same row.
export const saveTheDateResponses = sqliteTable('save_the_date_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  postcode: text('postcode').notNull(),
  country: text('country').notNull(),
  // interest only — the couple block-book the rooms themselves
  stayNightBefore: integer('stay_night_before', { mode: 'boolean' }).notNull().default(false),
  stayNightOf: integer('stay_night_of', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export const partiesRelations = relations(parties, ({ many }) => ({
  guests: many(guests),
}))

export const guestsRelations = relations(guests, ({ one }) => ({
  party: one(parties, { fields: [guests.partyId], references: [parties.id] }),
}))
