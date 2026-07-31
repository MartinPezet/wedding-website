// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

const COLLIDING_TOKEN = 'AAAAAAAAAA'
const FRESH_TOKEN = 'BBBBBBBBBB'
const tokenQueue = [COLLIDING_TOKEN, FRESH_TOKEN]

vi.mock('../../server/utils/token', () => ({
  generatePartyToken: vi.fn(() => tokenQueue.shift() ?? FRESH_TOKEN),
}))

describe('createParty', () => {
  it('retries with a new token when a generated token collides with an existing one', async () => {
    const { createDb } = await import('../../server/utils/db')
    const { migrate } = await import('drizzle-orm/libsql/migrator')
    const { parties } = await import('../../server/db/schema')
    const { createParty } = await import('../../server/utils/parties')

    const db = createDb(':memory:')
    await migrate(db, { migrationsFolder: 'server/db/migrations' })
    await db.insert(parties).values({ name: 'Existing Party', token: COLLIDING_TOKEN })

    const party = await createParty(db, { name: 'New Party', guests: [] })
    expect(party.token).toBe(FRESH_TOKEN)
  })
})
