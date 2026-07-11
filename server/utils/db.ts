import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../db/schema'

export function createDb(url: string, authToken?: string) {
  return drizzle(createClient({ url, authToken }), { schema })
}

export type Db = ReturnType<typeof createDb>

let db: Db | undefined

export function useDb(): Db {
  if (!db) {
    const config = useRuntimeConfig()
    db = createDb(config.dbUrl || 'file:./.data/wedding.db', config.dbAuthToken || undefined)
  }
  return db
}
