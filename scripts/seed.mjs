// Applies migrations and seeds settings + sample parties (idempotent).
// Usage: node scripts/seed.mjs   [NUXT_DB_URL / NUXT_DB_AUTH_TOKEN override the target]
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const url = process.env.NUXT_DB_URL || 'file:./.data/wedding.db'
if (url.startsWith('file:')) mkdirSync('./.data', { recursive: true })

const client = createClient({ url, authToken: process.env.NUXT_DB_AUTH_TOKEN || undefined })
await migrate(drizzle(client), { migrationsFolder: './server/db/migrations' })

// placeholder values until real date/deadline confirmed
const settings = {
  wedding_date: '2027-06-12',
  rsvp_deadline: '2027-05-01T23:59:59Z',
}
for (const [key, value] of Object.entries(settings)) {
  await client.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING',
    args: [key, value],
  })
}

const { rows: [{ n: partyCount }] } = await client.execute('SELECT COUNT(*) AS n FROM parties')
if (Number(partyCount) === 0) {
  const sampleParties = [
    { name: 'The Sample Family', guests: [{ name: 'Sam Sample' }, { name: 'Sasha Sample' }, { name: 'Sunny Sample', isChild: true }] },
    { name: 'Riley Guest', guests: [{ name: 'Riley Guest' }] },
  ]
  for (const party of sampleParties) {
    const token = randomBytes(32).toString('base64url')
    const { rows: [inserted] } = await client.execute({
      sql: 'INSERT INTO parties (name, token) VALUES (?, ?) RETURNING id',
      args: [party.name, token],
    })
    for (const [index, guest] of party.guests.entries()) {
      await client.execute({
        sql: 'INSERT INTO guests (party_id, name, sort_order, is_child) VALUES (?, ?, ?, ?)',
        args: [inserted.id, guest.name, index, guest.isChild ? 1 : 0],
      })
    }
    console.log(`${party.name}: /rsvp?t=${token}`)
  }
}

console.log(`Seeded ${url}`)
client.close()
