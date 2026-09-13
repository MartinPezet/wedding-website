// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

// variable path so a missing module fails tests, not the whole file
const paymentsUtil = async () => await import(`../../server/utils/${'payments'}.ts`)

const freshDb = async (migrationsFolder = 'server/db/migrations') => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder })
  return db
}

const seedParty = async (db: Awaited<ReturnType<typeof freshDb>>) => {
  const { createParty } = await import('../../server/utils/parties')
  return createParty(db, { name: 'The Payers', guests: [{ name: 'Pat Payer' }] })
}

describe('recordPayment / amountPaidFor', () => {
  it('records a Monzo transaction once however often it is re-recorded', async () => {
    const db = await freshDb()
    const party = await seedParty(db)
    const { recordPayment, amountPaidFor } = await paymentsUtil()

    const payment = { partyId: party.id, transactionId: 'tx_0001', amount: 160, matchedOn: 'reference' as const }
    expect(await recordPayment(db, payment)).toBe(true)
    expect(await recordPayment(db, payment)).toBe(false)

    expect(await amountPaidFor(db, party.id)).toBe(160)
  })

  it('counts every manual row, which carry no transaction id', async () => {
    const db = await freshDb()
    const party = await seedParty(db)
    const { recordPayment, amountPaidFor } = await paymentsUtil()

    expect(await recordPayment(db, { partyId: party.id, transactionId: null, amount: 50, matchedOn: 'manual' })).toBe(true)
    expect(await recordPayment(db, { partyId: party.id, transactionId: null, amount: 45, matchedOn: 'manual' })).toBe(true)

    expect(await amountPaidFor(db, party.id)).toBe(95)
  })

  it('reads zero for a party with no payments', async () => {
    const db = await freshDb()
    const party = await seedParty(db)
    const { amountPaidFor } = await paymentsUtil()
    expect(await amountPaidFor(db, party.id)).toBe(0)
  })
})

describe('0005 migration backfill', () => {
  const dirs: string[] = []
  afterAll(() => dirs.forEach(dir => rmSync(dir, { recursive: true, force: true })))

  it('turns an amount the admin already entered into a manual payment row', async () => {
    // migrations folder as it stood before 0005
    const before = mkdtempSync(join(tmpdir(), 'migrations-'))
    dirs.push(before)
    cpSync('server/db/migrations', before, { recursive: true })
    rmSync(join(before, '0005_payments_and_pairing.sql'))
    const journalPath = join(before, 'meta', '_journal.json')
    const journal = JSON.parse(readFileSync(journalPath, 'utf8'))
    journal.entries = journal.entries.filter((entry: { tag: string }) => entry.tag !== '0005_payments_and_pairing')
    writeFileSync(journalPath, JSON.stringify(journal))

    const { createDb } = await import('../../server/utils/db')
    const { migrate } = await import('drizzle-orm/libsql/migrator')
    const { sql } = await import('drizzle-orm')
    const db = createDb(':memory:')
    await migrate(db, { migrationsFolder: before })
    await db.run(sql`INSERT INTO parties (name, token, amount_paid) VALUES ('The Early Payers', 'EARLY00001', 120), ('The Unpaid', 'UNPAID0001', 0)`)

    await migrate(db, { migrationsFolder: 'server/db/migrations' })

    const { payments } = await import('../../server/db/schema')
    const rows = await db.select().from(payments)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ amount: 120, transactionId: null, matchedOn: 'manual' })
    const { amountPaidFor } = await paymentsUtil()
    expect(await amountPaidFor(db, rows[0]!.partyId)).toBe(120)
  })
})
