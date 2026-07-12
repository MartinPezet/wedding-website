// Restores a backup dump (from GET /api/admin/backup) into the database.
// Usage: node scripts/restore.mjs <dump.json>   [NUXT_DB_URL / NUXT_DB_AUTH_TOKEN override the target]
// Mirrors server/utils/backup.ts restoreDatabase: replaces all table contents.
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/restore.mjs <dump.json>')
  process.exit(1)
}
const dump = JSON.parse(readFileSync(file, 'utf8'))

const url = process.env.NUXT_DB_URL || 'file:./.data/wedding.db'
const client = createClient({ url, authToken: process.env.NUXT_DB_AUTH_TOKEN || undefined })
await migrate(drizzle(client), { migrationsFolder: './server/db/migrations' })

async function restoreDatabase() {
  await client.execute('DELETE FROM guests')
  await client.execute('DELETE FROM parties')
  await client.execute('DELETE FROM settings')
  for (const party of dump.parties ?? []) {
    await client.execute({
      sql: 'INSERT INTO parties (id, name, token, song_request, note_to_couple, responded_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [party.id, party.name, party.token, party.songRequest, party.noteToCouple, party.respondedAt, party.updatedAt],
    })
  }
  for (const guest of dump.guests ?? []) {
    await client.execute({
      sql: 'INSERT INTO guests (id, party_id, name, sort_order, is_child, phone, attending, starter_choice_id, main_choice_id, dessert_choice_id, dietary_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        guest.id,
        guest.partyId,
        guest.name,
        guest.sortOrder,
        guest.isChild ? 1 : 0,
        guest.phone,
        guest.attending === null || guest.attending === undefined ? null : guest.attending ? 1 : 0,
        // pre-course dumps carry mealChoiceId — restore it as the main course
        guest.starterChoiceId ?? null,
        guest.mainChoiceId ?? guest.mealChoiceId ?? null,
        guest.dessertChoiceId ?? null,
        guest.dietaryNotes,
      ],
    })
  }
  for (const setting of dump.settings ?? []) {
    await client.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?)',
      args: [setting.key, setting.value],
    })
  }
}

await restoreDatabase()
console.log(`Restored ${dump.parties?.length ?? 0} parties, ${dump.guests?.length ?? 0} guests, ${dump.settings?.length ?? 0} settings into ${url}`)
client.close()
