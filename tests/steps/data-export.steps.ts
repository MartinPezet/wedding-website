// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ExcelJS from 'exceljs'
import { expect, vi } from 'vitest'
import { menu } from '../../shared/content'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/data-export.feature')

mockNuxtImport('useRuntimeConfig', () => () => ({ backupSecret: 'backup-secret' }))
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('getHeader', (event: { headers?: Record<string, string> }, name: string) => event.headers?.[name.toLowerCase()])
vi.stubGlobal('getUserSession', async (event: { session?: Record<string, unknown> | null }) => event.session ?? null)
vi.stubGlobal('setHeader', () => {})

// variable paths so missing modules fail scenarios, not the whole file
const exportUtil = async () => await import(`../../server/utils/${'export'}.ts`)
const backupUtil = async () => await import(`../../server/utils/${'backup'}.ts`)

type Db = Awaited<ReturnType<typeof freshDb>>

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

interface SeedGuest {
  name: string
  isChild?: boolean
  phone?: string
  attending?: boolean | null
  starterChoiceId?: string | null
  mainChoiceId?: string | null
  dessertChoiceId?: string | null
  dietaryNotes?: string | null
}

const course = (id: 'starter' | 'main' | 'dessert') => menu.courses.find(entry => entry.id === id)!

const seedParty = async (db: Db, name: string, seedGuests: SeedGuest[], over: { responded?: boolean, songRequest?: string, noteToCouple?: string } = {}) => {
  const { createParty } = await import('../../server/utils/parties')
  const { parties, guests } = await import('../../server/db/schema')
  const { eq } = await import('drizzle-orm')
  const party = await createParty(db, { name, guests: seedGuests.map(seed => ({ name: seed.name, isChild: seed.isChild })) })
  await db.update(parties).set({
    respondedAt: over.responded ? new Date().toISOString() : null,
    songRequest: over.songRequest ?? null,
    noteToCouple: over.noteToCouple ?? null,
  }).where(eq(parties.id, party.id))
  const rows = await db.query.guests.findMany({ where: eq(guests.partyId, party.id) })
  for (const [index, seed] of seedGuests.entries()) {
    await db.update(guests).set({
      phone: seed.phone ?? null,
      attending: seed.attending ?? null,
      starterChoiceId: seed.starterChoiceId ?? null,
      mainChoiceId: seed.mainChoiceId ?? null,
      dessertChoiceId: seed.dessertChoiceId ?? null,
      dietaryNotes: seed.dietaryNotes ?? null,
    }).where(eq(guests.id, rows[index]!.id))
  }
  return party
}

const mixedSeed = async (db: Db) => {
  await seedParty(db, 'The Fulls', [
    {
      name: 'Amy Full',
      phone: '+447911123456',
      attending: true,
      starterChoiceId: course('starter').options[0]!.id,
      mainChoiceId: course('main').options[0]!.id,
      dessertChoiceId: course('dessert').options[0]!.id,
      dietaryNotes: 'no nuts',
    },
    {
      name: 'Kid Full',
      isChild: true,
      attending: true,
      starterChoiceId: course('starter').options[1]!.id,
      mainChoiceId: course('main').childOptions![0]!.id,
      dessertChoiceId: course('dessert').childOptions![0]!.id,
    },
  ], { responded: true, songRequest: 'Dancing Queen', noteToCouple: 'Congrats!' })
  await seedParty(db, 'The Nopes', [{ name: 'Nia Nope', phone: '+447700123456', attending: false }], { responded: true })
  await seedParty(db, 'The Ghosts', [{ name: 'Gil Ghost' }], {})
}

const loadWorkbook = async (buffer: Uint8Array) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as never)
  return workbook
}

const allCellText = (workbook: ExcelJS.Workbook) => {
  const values: string[] = []
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        values.push(String(cell.value ?? ''))
      })
    })
  }
  return values
}

const sheetText = (workbook: ExcelJS.Workbook, name: string) => {
  const sheet = workbook.getWorksheet(name)
  expect(sheet, `worksheet ${name}`).toBeTruthy()
  const values: string[] = []
  sheet!.eachRow((row) => {
    row.eachCell((cell) => {
      values.push(String(cell.value ?? ''))
    })
  })
  return values.join(' | ')
}

describeFeature(feature, (f) => {
  f.Rule('Venue Excel export', (r) => {
    r.RuleScenario('Venue pack downloaded', (s) => {
      let db: Db
      let workbook: ExcelJS.Workbook
      s.Given('attending guests with per-course meal choices', async () => {
        db = await freshDb()
        await mixedSeed(db)
      })
      s.When('the admin requests the venue export', async () => {
        const { buildVenueWorkbook } = await exportUtil()
        workbook = await loadWorkbook(await buildVenueWorkbook(db))
        // the dashboard exposes the export as a download link
        expect(readFileSync('app/pages/admin/index.vue', 'utf8')).toContain('/api/admin/export/venue')
      })
      s.Then('an .xlsx is returned with an attendee sheet holding one column per defined course and a meal-totals sheet grouped by course, matching current data', () => {
        const attendees = sheetText(workbook, 'Attendees')
        // one column per defined course
        for (const entry of menu.courses) {
          expect(attendees).toContain(entry.name)
        }
        expect(attendees).toContain('Amy Full')
        expect(attendees).toContain('Kid Full')
        expect(attendees).toContain(course('starter').options[0]!.name)
        expect(attendees).toContain(course('main').options[0]!.name)
        expect(attendees).toContain(course('dessert').options[0]!.name)
        expect(attendees).toContain(course('main').childOptions![0]!.name)
        expect(attendees).toContain('no nuts')
        // only attending guests appear
        expect(attendees).not.toContain('Nia Nope')
        expect(attendees).not.toContain('Gil Ghost')
        // totals grouped by course, child options included
        const totals = sheetText(workbook, 'Meal Totals')
        for (const entry of menu.courses) {
          expect(totals).toContain(entry.name)
        }
        expect(totals).toContain(course('main').options[0]!.name)
        expect(totals).toContain(course('main').childOptions![0]!.name)
        expect(totals).toContain(course('dessert').childOptions![0]!.name)
      })
    })

    r.RuleScenario('No phones in venue file', (s) => {
      let db: Db
      let workbook: ExcelJS.Workbook
      s.Given('guests with stored phone numbers', async () => {
        db = await freshDb()
        await mixedSeed(db)
      })
      s.When('the venue workbook is generated', async () => {
        const { buildVenueWorkbook } = await exportUtil()
        workbook = await loadWorkbook(await buildVenueWorkbook(db))
      })
      s.Then('no sheet contains any phone number column or value', () => {
        for (const value of allCellText(workbook)) {
          expect(value).not.toMatch(/phone/i)
          expect(value).not.toMatch(/\+44\d+/)
        }
      })
    })
  })

  f.Rule('Full guest list export', (r) => {
    r.RuleScenario('Full export', (s) => {
      let db: Db
      let workbook: ExcelJS.Workbook
      s.Given('parties, guests, and RSVP responses', async () => {
        db = await freshDb()
        await mixedSeed(db)
      })
      s.When('the admin requests the full export', async () => {
        const { buildFullWorkbook } = await exportUtil()
        workbook = await loadWorkbook(await buildFullWorkbook(db))
        expect(readFileSync('app/pages/admin/index.vue', 'utf8')).toContain('/api/admin/export/full')
      })
      s.Then('an .xlsx is returned containing every guest with phones, statuses, per-course choices, dietary notes, song requests, and notes', () => {
        const text = allCellText(workbook).join(' | ')
        for (const guest of ['Amy Full', 'Kid Full', 'Nia Nope', 'Gil Ghost']) {
          expect(text).toContain(guest)
        }
        expect(text).toContain('+447911123456')
        for (const entry of menu.courses) {
          expect(text).toContain(entry.name)
        }
        expect(text).toContain(course('starter').options[0]!.name)
        expect(text).toContain(course('main').options[0]!.name)
        expect(text).toContain(course('dessert').options[0]!.name)
        expect(text).toContain('no nuts')
        expect(text).toContain('Dancing Queen')
        expect(text).toContain('Congrats!')
      })
    })
  })

  f.Rule('JSON backup endpoint', (r) => {
    type Handler = (event: Record<string, unknown>) => Promise<unknown>
    const guard = async (): Promise<Handler> =>
      (await import('../../server/middleware/admin-guard')).default as unknown as Handler
    const backupHandler = async (): Promise<Handler> =>
      (await import(`../../server/api/admin/${'backup.get'}.ts`)).default as unknown as Handler

    r.RuleScenario('Automated backup fetch', (s) => {
      let db: Db
      const event: Record<string, unknown> = {
        path: '/api/admin/backup',
        headers: { authorization: 'Bearer backup-secret' },
      }
      let dump: { parties: unknown[], guests: unknown[], settings: unknown[] }
      s.Given('the correct bearer secret', async () => {
        db = await freshDb()
        await mixedSeed(db)
        vi.stubGlobal('useDb', () => db)
      })
      s.When('the backup endpoint is called', async () => {
        await (await guard())(event)
        dump = await (await backupHandler())(event) as typeof dump
      })
      s.Then('a JSON dump of all tables is returned', () => {
        expect(dump.parties).toHaveLength(3)
        expect(dump.guests).toHaveLength(4)
        expect(Array.isArray(dump.settings)).toBe(true)
        expect(dump.parties[0]).toMatchObject({ name: expect.any(String), token: expect.any(String) })
      })
    })

    r.RuleScenario('Unauthorised backup call', (s) => {
      const event: Record<string, unknown> = { path: '/api/admin/backup', headers: {} }
      let thrown: { statusCode?: number } | undefined
      s.Given('no valid credentials', () => {})
      s.When('the backup endpoint is called', async () => {
        thrown = await (await guard())(event).then(() => undefined, error => error)
      })
      s.Then('the request is rejected and no data is returned', () => {
        expect(thrown?.statusCode).toBe(401)
      })
    })

    r.RuleScenario('Restore', (s) => {
      let source: Db
      let dump: unknown
      let target: Db
      s.Given('a dump file', async () => {
        source = await freshDb()
        await mixedSeed(source)
        const { settings } = await import('../../server/db/schema')
        await source.insert(settings).values({ key: 'rsvp_deadline', value: '2027-05-01T23:59:59Z' })
        const { dumpDatabase } = await backupUtil()
        dump = await dumpDatabase(source)
      })
      s.When('the restore script runs against it', async () => {
        target = await freshDb()
        const { restoreDatabase } = await backupUtil()
        await restoreDatabase(target, dump)
        // the standalone script wraps the same restore
        expect(readFileSync('scripts/restore.mjs', 'utf8')).toContain('restoreDatabase')
      })
      s.Then('the database contents match the dump', async () => {
        const { dumpDatabase } = await backupUtil()
        const roundTripped = await dumpDatabase(target)
        expect(roundTripped).toEqual(dump)
        const restoredParties = (roundTripped as { parties: { name: string }[] }).parties
        expect(restoredParties.map(party => party.name).sort()).toEqual(['The Fulls', 'The Ghosts', 'The Nopes'])
      })
    })
  })
})
