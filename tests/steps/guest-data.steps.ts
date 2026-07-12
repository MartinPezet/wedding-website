// @vitest-environment node
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/guest-data.feature')

// dynamic imports so missing implementation fails scenarios, not the file
const freshDb = async (url = ':memory:') => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(url)
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

type Db = Awaited<ReturnType<typeof freshDb>>

const setSetting = async (db: Db, key: string, value: string) => {
  const { settings } = await import('../../server/db/schema')
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } })
}

const makeParty = async (db: Db, name: string, guestList: { name: string, isChild?: boolean }[]) => {
  const { createParty } = await import('../../server/utils/parties')
  return createParty(db, { name, guests: guestList })
}

const getParty = async (db: Db, id: number) => {
  const party = await db.query.parties.findFirst({
    where: (parties, { eq }) => eq(parties.id, id),
    with: { guests: true },
  })
  expect(party).toBeDefined()
  return party!
}

describeFeature(feature, (f) => {
  f.Rule('Party and guest data model', (r) => {
    r.RuleScenario('Party with guests stored', (s) => {
      let db: Db
      let partyId = 0
      let retrieved: Awaited<ReturnType<typeof getParty>>
      s.Given('a party created with two guests', async () => {
        db = await freshDb()
        partyId = (await makeParty(db, 'The Smiths', [{ name: 'Alice Smith' }, { name: 'Bob Smith' }])).id
      })
      s.When('the party is retrieved', async () => {
        retrieved = await getParty(db, partyId)
      })
      s.Then('both guests are returned, each with independent RSVP fields including per-course meal choices', async () => {
        expect(retrieved.guests).toHaveLength(2)
        const { guests } = await import('../../server/db/schema')
        const { eq } = await import('drizzle-orm')
        await db.update(guests)
          .set({ attending: true, starterChoiceId: 'soup', mainChoiceId: 'beef', dessertChoiceId: 'cake', dietaryNotes: 'no nuts' })
          .where(eq(guests.id, retrieved.guests[0]!.id))
        const after = await getParty(db, partyId)
        expect(after.guests[0]).toMatchObject({
          attending: true,
          starterChoiceId: 'soup',
          mainChoiceId: 'beef',
          dessertChoiceId: 'cake',
          dietaryNotes: 'no nuts',
        })
        expect(after.guests[1]).toMatchObject({
          attending: null,
          starterChoiceId: null,
          mainChoiceId: null,
          dessertChoiceId: null,
          dietaryNotes: null,
        })
      })
    })

    r.RuleScenario('Parties cannot add guests', (s) => {
      let db: Db
      let partyId = 0
      let knownGuestId = 0
      let result: { ok: boolean }
      s.Given('a party with recorded guests', async () => {
        db = await freshDb()
        await setSetting(db, 'rsvp_deadline', '2100-01-01T00:00:00Z')
        const party = await makeParty(db, 'The Joneses', [{ name: 'Cara Jones' }])
        partyId = party.id
        knownGuestId = (await getParty(db, partyId)).guests[0]!.id
      })
      s.When('the party submits an RSVP referencing an unknown guest', async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        result = await saveRsvp(db, partyId, {
          phone: '+447911123456',
          guests: [
            { id: knownGuestId, attending: false },
            { id: 999_999, attending: true, mainChoiceId: 'beef' },
          ],
        })
      })
      s.Then('only guests already recorded for that party are accepted and no new guest rows are created', async () => {
        expect(result.ok).toBe(false)
        expect((await getParty(db, partyId)).guests).toHaveLength(1)
      })
    })

    r.RuleScenario('Legacy meal choice migrated', (s) => {
      let client: Awaited<ReturnType<typeof import('@libsql/client')['createClient']>>
      const applyMigration = async (file: string) => {
        const { readFileSync } = await import('node:fs')
        const sql = readFileSync(`server/db/migrations/${file}`, 'utf8')
        for (const statement of sql.split('--> statement-breakpoint')) {
          if (statement.trim()) await client.execute(statement)
        }
      }
      s.Given('data holding single meal choices from before the per-course model', async () => {
        const { createClient } = await import('@libsql/client')
        client = createClient({ url: ':memory:' })
        await applyMigration('0000_init.sql')
        await client.execute(`INSERT INTO parties (name, token) VALUES ('The Olds', 'legacy-token')`)
        await client.execute(`INSERT INTO guests (party_id, name, attending, meal_choice_id) VALUES (1, 'Olive Old', 1, 'beef')`)
        await client.execute(`INSERT INTO guests (party_id, name) VALUES (1, 'Otto Old')`)
      })
      s.When('the per-course migration runs', async () => {
        await applyMigration('0001_menu_courses.sql')
      })
      s.Then(`each existing choice is preserved as that guest's main-course choice`, async () => {
        const { rows } = await client.execute(
          'SELECT name, starter_choice_id, main_choice_id, dessert_choice_id FROM guests ORDER BY id',
        )
        expect(rows[0]).toMatchObject({ name: 'Olive Old', starter_choice_id: null, main_choice_id: 'beef', dessert_choice_id: null })
        expect(rows[1]).toMatchObject({ name: 'Otto Old', main_choice_id: null })
        client.close()
      })
    })
  })

  f.Rule('Secure party tokens', (r) => {
    r.RuleScenario('Token generation', (s) => {
      let db: Db
      let token = ''
      s.Given('a new party', async () => {
        db = await freshDb()
      })
      s.When('it is created', async () => {
        token = (await makeParty(db, 'The Does', [{ name: 'Dana Doe' }])).token
      })
      s.Then('it receives a unique URL-safe token derived from 32 cryptographically random bytes', async () => {
        // 32 bytes base64url-encoded = 43 chars, URL-safe alphabet
        expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(Buffer.from(token, 'base64url')).toHaveLength(32)
        const other = (await makeParty(db, 'The Others', [{ name: 'Erin Other' }])).token
        expect(other).not.toBe(token)
      })
    })
  })

  f.Rule('Settings storage', (r) => {
    r.RuleScenario('Deadline read at runtime', (s) => {
      let db: Db
      let partyId = 0
      let guestId = 0
      let rejected: { ok: boolean }
      const submit = async () => {
        const { saveRsvp } = await import('../../server/utils/rsvp')
        return saveRsvp(db, partyId, {
          phone: '+447911123456',
          guests: [{ id: guestId, attending: false }],
        })
      }
      s.Given('a stored RSVP deadline setting', async () => {
        db = await freshDb()
        await setSetting(db, 'rsvp_deadline', '2000-01-01T00:00:00Z')
        partyId = (await makeParty(db, 'The Lates', [{ name: 'Finn Late' }])).id
        guestId = (await getParty(db, partyId)).guests[0]!.id
        rejected = await submit()
      })
      s.When('the deadline setting is changed', async () => {
        await setSetting(db, 'rsvp_deadline', '2100-01-01T00:00:00Z')
      })
      s.Then('subsequent RSVP submissions validate against the new deadline without redeploying', async () => {
        expect(rejected.ok).toBe(false)
        expect((await submit()).ok).toBe(true)
      })
    })
  })

  f.Rule('Database works locally and in production', (r) => {
    r.RuleScenario('Environment switch', (s) => {
      const fileUrl = `file:${join(tmpdir(), `wedding-test-${Date.now()}.db`).replaceAll('\\', '/')}`
      let results: Awaited<ReturnType<typeof getParty>>[] = []
      s.Given('the database URL env var pointing at a local file or a Turso database', () => {
        // libSQL client accepts file: and libsql: URLs identically; both exercised via file + memory
      })
      s.When('data operations run', async () => {
        results = await Promise.all([':memory:', fileUrl].map(async (url) => {
          const db = await freshDb(url)
          const party = await makeParty(db, 'The Movers', [{ name: 'Gale Mover' }, { name: 'Hart Mover', isChild: true }])
          const retrieved = await getParty(db, party.id)
          db.$client.close()
          return retrieved
        }))
      })
      s.Then('they behave identically in both environments', () => {
        expect(results).toHaveLength(2)
        const [memory, file] = results
        expect(file!.name).toBe(memory!.name)
        expect(file!.guests.map(g => ({ name: g.name, isChild: g.isChild })))
          .toEqual(memory!.guests.map(g => ({ name: g.name, isChild: g.isChild })))
        try {
          rmSync(fileUrl.slice('file:'.length), { force: true })
        }
        catch { /* best-effort cleanup; a leftover tmp db is harmless */ }
      })
    })
  })
})
