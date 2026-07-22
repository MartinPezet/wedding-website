// Applies pending Drizzle migrations. Target via NUXT_DB_URL / NUXT_DB_AUTH_TOKEN
// (defaults to the local dev database). Used by deploy.yml against Turso.
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const url = process.env.NUXT_DB_URL || 'file:./.data/wedding.db'
const client = createClient({ url, authToken: process.env.NUXT_DB_AUTH_TOKEN || undefined })
await migrate(drizzle(client), { migrationsFolder: './server/db/migrations' })
console.log(`Migrations applied to ${url}`)
client.close()
