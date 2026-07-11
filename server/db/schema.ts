import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
  mealChoiceId: text('meal_choice_id'),
  dietaryNotes: text('dietary_notes'),
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
