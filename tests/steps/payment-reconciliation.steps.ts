// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'
import { clearNuxtData } from '#imports'
import type { RoomChoice, RoomNight } from '#shared/content'
import { paymentReference } from '#shared/utils/rooms'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/payment-reconciliation.feature')

// variable paths so missing modules fail scenarios, not the whole file
const reconcileUtil = async () => await import(`../../server/utils/${'reconcile'}.ts`)
const monzoUtil = async () => await import(`../../server/utils/${'monzo'}.ts`)

const freshDb = async () => {
  const { createDb } = await import('../../server/utils/db')
  const { migrate } = await import('drizzle-orm/libsql/migrator')
  const db = createDb(':memory:')
  await migrate(db, { migrationsFolder: 'server/db/migrations' })
  return db
}

type Db = Awaited<ReturnType<typeof freshDb>>

const CONFIG = { monzoClientId: 'oauth2client_test', monzoClientSecret: 'mnzconf.secret' }
const REDIRECT = 'https://wedding.test/api/admin/monzo/callback'
const TOKEN = 'tok_never_store_me'

/** a party owing for one room: our_room on the night of is £160, a night-before share £95 */
const seedParty = async (db: Db, name: string, guestNames: string[], room: { night: RoomNight, choice: RoomChoice, occupants?: number }) => {
  const { createParty } = await import('../../server/utils/parties')
  const { roomRequests } = await import('../../server/db/schema')
  const party = await createParty(db, { name, guests: guestNames.map(guest => ({ name: guest })) })
  await db.insert(roomRequests).values({ partyId: party.id, night: room.night, choice: room.choice, occupants: room.occupants ?? 1 })
  return party.id
}

interface Credit {
  transactionId: string
  amount: number
  created: string
  reference: string
  payerName: string | null
}

const credit = (over: Partial<Credit>): Credit => ({
  transactionId: 'tx_00001',
  amount: 160,
  created: '2026-09-01T10:00:00Z',
  reference: '',
  payerName: null,
  ...over,
})

/** a stand-in for api.monzo.com — no live calls in tests */
const fakeMonzo = (transactions: { id: string, amount: number, created: string, description: string, counterparty?: { name?: string } }[]) => {
  const calls: { url: string, options?: { query?: Record<string, unknown> } }[] = []
  const fetcher = async (url: string, options?: { query?: Record<string, unknown> }) => {
    calls.push({ url, options })
    if (url.endsWith('/accounts')) return { accounts: [{ id: 'acc_joint', closed: false }] }
    if (url.endsWith('/transactions')) return { transactions }
    if (url.endsWith('/oauth2/token')) return { access_token: TOKEN }
    throw new Error(`unexpected Monzo call ${url}`)
  }
  return { fetcher, calls }
}

const setLastChecked = async (db: Db, value: string) => {
  const { settings } = await import('../../server/db/schema')
  await db.insert(settings).values({ key: 'monzo_last_checked', value })
}

const lastChecked = async (db: Db) => {
  const { getLastChecked } = await reconcileUtil()
  return getLastChecked(db)
}

const storedPayments = async (db: Db) => {
  const { payments } = await import('../../server/db/schema')
  return db.select().from(payments)
}

const everythingStored = async (db: Db) => {
  const { dumpDatabase } = await import('../../server/utils/backup')
  return JSON.stringify(await dumpDatabase(db))
}

const reconcile = async (db: Db, credits: Credit[], now?: Date) => {
  const { runReconciliation } = await reconcileUtil()
  return runReconciliation(db, async () => credits, now)
}

interface Status { available: boolean, authorised: boolean, lastChecked: string | null, stale: boolean }

const mountPayments = async (
  status: Status,
  handlers: { check?: () => unknown, assign?: () => unknown } = {},
) => {
  clearNuxtData()
  registerEndpoint('/api/admin/monzo/status', { method: 'GET', handler: () => status })
  registerEndpoint('/api/admin/parties', { method: 'GET', handler: () => ({ parties: [{ id: 1, name: 'The Ables', roomTotal: 160, amountPaid: 0, guests: [] }] }) })
  registerEndpoint('/api/admin/monzo/check', { method: 'POST', handler: handlers.check ?? (() => ({ matched: [], unmatched: [] })) })
  registerEndpoint('/api/admin/monzo/assign', { method: 'POST', handler: handlers.assign ?? (() => ({ ok: true })) })
  const name = 'payments'
  const page = (await import(`../../app/pages/admin/${name}.vue`)).default
  return mountSuspended(page)
}

describeFeature(feature, (f) => {
  f.Rule('Admin-triggered Monzo reconciliation', (r) => {
    r.RuleScenario('Admin runs a check', (s) => {
      let db: Db
      let partyId = 0
      let monzo: ReturnType<typeof fakeMonzo>
      let result: { matched: { partyId: number }[] }
      s.Given('an admin who has authorised Monzo', async () => {
        db = await freshDb()
        partyId = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        monzo = fakeMonzo([
          { id: 'tx_ref', amount: 16000, created: '2026-09-01T10:00:00Z', description: paymentReference(partyId), counterparty: { name: 'Ann Able' } },
        ])
        const { completeAuthorisation } = await monzoUtil()
        expect(await completeAuthorisation(CONFIG, REDIRECT, { code: 'auth_code', state: 'st_1' }, 'st_1', monzo.fetcher))
          .toEqual({ ok: true, token: TOKEN })
      })
      s.When('the check runs', async () => {
        const { runReconciliation } = await reconcileUtil()
        const { fetchCredits } = await monzoUtil()
        result = await runReconciliation(db, (since?: string) => fetchCredits(TOKEN, since, monzo.fetcher))
      })
      s.Then('transactions are fetched once, payments are matched, and no Monzo token is left stored', async () => {
        expect(monzo.calls.filter(call => call.url.endsWith('/transactions'))).toHaveLength(1)
        expect(result.matched).toMatchObject([{ partyId }])
        expect(await everythingStored(db)).not.toContain(TOKEN)

        // the check route drops the token from the sealed session the moment the run ends
        const session: { secure?: Record<string, unknown> } = { secure: { monzoToken: TOKEN } }
        vi.stubGlobal('getUserSession', async () => session)
        vi.stubGlobal('replaceUserSession', async (_event: unknown, data: typeof session) => {
          session.secure = data.secure
        })
        try {
          const { checkPayments } = await reconcileUtil()
          // the fake is passed in: $fetch can't be stubbed in this environment and would go live
          await checkPayments({}, db, monzo.fetcher).catch((failure: { cause?: unknown }) => {
            // surface what actually went wrong rather than the route's friendly message
            throw failure.cause ?? failure
          })
        }
        finally {
          vi.unstubAllGlobals()
        }
        expect(session.secure?.monzoToken).toBeUndefined()
      })
    })

    r.RuleScenario('No credentials configured', (s) => {
      let db: Db
      const empty = { monzoClientId: '', monzoClientSecret: '' }
      let status: { available: boolean }
      s.Given('Monzo client credentials absent from runtime config', async () => {
        db = await freshDb()
      })
      s.When('the admin opens the reconciliation page', async () => {
        const { reconciliationStatus } = await reconcileUtil()
        status = await reconciliationStatus(db, empty)
      })
      s.Then('it reports itself unavailable and no authorisation is attempted', async () => {
        expect(status.available).toBe(false)
        const { authorisationUrl, monzoConfigured } = await monzoUtil()
        expect(monzoConfigured(empty)).toBe(false)
        expect(() => authorisationUrl(empty, REDIRECT, 'st_1')).toThrow()

        const wrapper = await mountPayments({ ...status, authorised: false, lastChecked: null, stale: false })
        expect(wrapper.find('[data-unavailable]').exists()).toBe(true)
        expect(wrapper.find('a[href="/api/admin/monzo/authorise"]').exists()).toBe(false)
        expect(wrapper.find('[data-run-check]').exists()).toBe(false)
      })
    })

    r.RuleScenario('Authorisation refused', (s) => {
      let db: Db
      let monzo: ReturnType<typeof fakeMonzo>
      let outcomes: { ok: boolean }[] = []
      s.Given('an admin who declines the Monzo authorisation', async () => {
        db = await freshDb()
        await setLastChecked(db, '2026-08-01T00:00:00.000Z')
        monzo = fakeMonzo([])
      })
      s.When('the callback is processed', async () => {
        const { completeAuthorisation } = await monzoUtil()
        outcomes = [
          await completeAuthorisation(CONFIG, REDIRECT, { error: 'access_denied', state: 'st_1' }, 'st_1', monzo.fetcher),
          // a callback that isn't answering our own request is refused the same way
          await completeAuthorisation(CONFIG, REDIRECT, { code: 'auth_code', state: 'forged' }, 'st_1', monzo.fetcher),
        ]
      })
      s.Then('the run is abandoned, nothing is stored, and the last-checked time is unchanged', async () => {
        expect(outcomes.map(outcome => outcome.ok)).toEqual([false, false])
        expect(monzo.calls).toHaveLength(0)
        expect(await storedPayments(db)).toHaveLength(0)
        expect(await lastChecked(db)).toBe('2026-08-01T00:00:00.000Z')
      })
    })
  })

  f.Rule('Only incoming credits since the last successful check', (r) => {
    r.RuleScenario('Spending ignored', (s) => {
      let db: Db
      let partyId = 0
      let credits: Credit[] = []
      let result: { matched: unknown[], unmatched: Credit[] }
      s.Given('fetched transactions including card payments and direct debits', async () => {
        db = await freshDb()
        partyId = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        const monzo = fakeMonzo([
          { id: 'tx_card', amount: -2500, created: '2026-09-01T09:00:00Z', description: 'TESCO STORES' },
          { id: 'tx_dd', amount: -16000, created: '2026-09-01T09:30:00Z', description: 'COUNCIL TAX' },
          { id: 'tx_guest', amount: 16000, created: '2026-09-01T10:00:00Z', description: paymentReference(partyId) },
        ])
        const { fetchCredits } = await monzoUtil()
        credits = await fetchCredits(TOKEN, undefined, monzo.fetcher)
      })
      s.When('the check matches them', async () => {
        result = await reconcile(db, credits)
      })
      s.Then('none of them are considered for matching', async () => {
        expect(credits.map(entry => entry.transactionId)).toEqual(['tx_guest'])
        expect(credits[0]).toMatchObject({ amount: 160 })
        expect(result.matched).toHaveLength(1)
        expect(result.unmatched).toHaveLength(0)
        expect((await storedPayments(db)).map(payment => payment.transactionId)).toEqual(['tx_guest'])
      })
    })

    r.RuleScenario('Window advances on success', (s) => {
      let db: Db
      let since: string | undefined
      const now = new Date('2026-09-13T12:00:00.000Z')
      s.Given('a check that completes successfully', async () => {
        db = await freshDb()
        await setLastChecked(db, '2026-08-01T00:00:00.000Z')
      })
      s.When('it finishes', async () => {
        const { runReconciliation } = await reconcileUtil()
        await runReconciliation(db, async (from?: string) => {
          since = from
          return []
        }, now)
      })
      s.Then(`the last-checked time is updated to that run's time`, async () => {
        // the run only asked for what arrived since the previous success
        expect(since).toBe('2026-08-01T00:00:00.000Z')
        expect(await lastChecked(db)).toBe(now.toISOString())
      })
    })

    r.RuleScenario('Window held on failure', (s) => {
      let db: Db
      let failure: unknown
      s.Given('a check that fails partway through', async () => {
        db = await freshDb()
        await setLastChecked(db, '2026-08-01T00:00:00.000Z')
      })
      s.When('it aborts', async () => {
        const { runReconciliation } = await reconcileUtil()
        failure = await runReconciliation(db, async () => {
          throw new Error('Monzo went away')
        }).then(() => undefined, (error: unknown) => error)
      })
      s.Then('the last-checked time is left as it was, so the next run covers the same period', async () => {
        expect(failure).toBeInstanceOf(Error)
        expect(await lastChecked(db)).toBe('2026-08-01T00:00:00.000Z')
      })
    })
  })

  f.Rule('Match order is reference, then payer name, then amount', (r) => {
    r.RuleScenario('Reference wins', (s) => {
      let db: Db
      let ables = 0
      let result: { matched: { partyId: number, matchedOn: string }[] }
      let chosen: Credit
      s.Given(`a credit carrying one party's reference and an amount equal to another party's balance`, async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        await seedParty(db, 'The Bakers', ['Ben Baker'], { night: 'before', choice: 'share_match' })
        chosen = credit({ reference: `Rooms ${paymentReference(ables)}`, amount: 95 })
      })
      s.When('the credit is matched', async () => {
        result = await reconcile(db, [chosen])
      })
      s.Then('it is matched to the party named by the reference', () => {
        expect(result.matched).toMatchObject([{ partyId: ables, matchedOn: 'reference' }])
      })
    })

    r.RuleScenario('Name used when no reference', (s) => {
      let db: Db
      let ables = 0
      let result: { matched: { partyId: number, matchedOn: string }[] }
      s.Given('a credit with no recognisable reference whose payer name matches a guest on exactly one party', async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able', 'Art Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        await seedParty(db, 'The Bakers', ['Ben Baker'], { night: 'of', choice: 'our_room', occupants: 2 })
      })
      s.When('the credit is matched', async () => {
        // banks send names shouty, initialled and titled
        result = await reconcile(db, [credit({ reference: 'wedding rooms', payerName: 'MR A ABLE', amount: 160 })])
      })
      s.Then('it is matched to that party', () => {
        expect(result.matched).toMatchObject([{ partyId: ables, matchedOn: 'name' }])
      })
    })

    r.RuleScenario('Amount alone is not enough to pick between parties', (s) => {
      let db: Db
      let result: { matched: unknown[], unmatched: Credit[] }
      s.Given(`a credit with no reference, no matching payer name, and an amount equal to two parties' balances`, async () => {
        db = await freshDb()
        await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        await seedParty(db, 'The Bakers', ['Ben Baker'], { night: 'of', choice: 'our_room', occupants: 2 })
      })
      s.When('the credit is matched', async () => {
        result = await reconcile(db, [credit({ payerName: 'ZED ZULU', amount: 160 })])
      })
      s.Then('it is left unmatched', async () => {
        expect(result.matched).toHaveLength(0)
        expect(result.unmatched).toMatchObject([{ transactionId: 'tx_00001' }])
        expect(await storedPayments(db)).toHaveLength(0)
      })
    })
  })

  f.Rule('Matched payments are recorded and never double-counted', (r) => {
    r.RuleScenario('Payment recorded', (s) => {
      let db: Db
      let ables = 0
      s.Given('a credit that matches a party', async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        const { amountPaidFor } = await import('../../server/utils/payments')
        expect(await amountPaidFor(db, ables)).toBe(0)
      })
      s.When('the credit is recorded', async () => {
        await reconcile(db, [credit({ reference: paymentReference(ables), amount: 80 })])
      })
      s.Then(`a payment is recorded for that party and the party's amount paid rises by the credit's amount`, async () => {
        const { amountPaidFor } = await import('../../server/utils/payments')
        expect(await amountPaidFor(db, ables)).toBe(80)
        expect(await storedPayments(db)).toMatchObject([{ partyId: ables, transactionId: 'tx_00001', amount: 80 }])
      })
    })

    r.RuleScenario('Re-running a check', (s) => {
      let db: Db
      let ables = 0
      let chosen: Credit
      let second: { matched: unknown[], unmatched: unknown[] }
      s.Given('a transaction already recorded by an earlier check', async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        chosen = credit({ reference: paymentReference(ables), amount: 160 })
        await reconcile(db, [chosen])
      })
      s.When('a check runs again over the same period', async () => {
        second = await reconcile(db, [chosen])
      })
      s.Then(`the transaction is recorded once and the party's amount paid is unchanged by the second run`, async () => {
        expect(await storedPayments(db)).toHaveLength(1)
        const { amountPaidFor } = await import('../../server/utils/payments')
        expect(await amountPaidFor(db, ables)).toBe(160)
        // already accounted for, so not offered again as unmatched either
        expect(second).toMatchObject({ matched: [], unmatched: [] })
      })
    })

    r.RuleScenario('Manual override still reconciles', (s) => {
      let db: Db
      let ables = 0
      s.Given('an admin recording a cash payment by hand', async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
      })
      s.When('it is saved', async () => {
        const { setAmountPaid } = await import('../../server/utils/admin')
        await setAmountPaid(db, ables, 50)
      })
      s.Then(`it is recorded with no transaction id and counts towards the party's amount paid`, async () => {
        expect(await storedPayments(db)).toMatchObject([{ partyId: ables, transactionId: null, amount: 50 }])
        const { amountPaidFor } = await import('../../server/utils/payments')
        expect(await amountPaidFor(db, ables)).toBe(50)
      })
    })
  })

  f.Rule('Unmatched credits are shown once and never stored', (r) => {
    const salary = credit({ transactionId: 'tx_salary', payerName: 'ACME PAYROLL LTD', reference: 'SALARY SEPT', amount: 2345.67 })

    r.RuleScenario('Unmatched credit offered for assignment', (s) => {
      let db: Db
      let result: { unmatched: Credit[] }
      s.Given('a check that finds a credit it cannot match', async () => {
        db = await freshDb()
        await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
      })
      s.When('the check returns', async () => {
        result = await reconcile(db, [salary])
      })
      s.Then('the credit is shown to the admin for assignment and nothing about it is written to the database', async () => {
        expect(result.unmatched).toEqual([salary])
        const stored = await everythingStored(db)
        for (const detail of ['tx_salary', 'ACME', 'SALARY', '2345.67']) {
          expect(stored).not.toContain(detail)
        }
      })
    })

    r.RuleScenario('Dismissed credit leaves no trace', (s) => {
      let db: Db
      let offered: Credit[] = []
      let wrapper: Awaited<ReturnType<typeof mountPayments>>
      let assigned = false
      s.Given('an unmatched credit shown to the admin', async () => {
        db = await freshDb()
        await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
        offered = (await reconcile(db, [salary])).unmatched
        expect(offered).toHaveLength(1)
        wrapper = await mountPayments(
          { available: true, authorised: true, lastChecked: null, stale: false },
          {
            check: () => ({ matched: [], unmatched: offered }),
            assign: () => {
              assigned = true
              return { ok: true }
            },
          },
        )
        await wrapper.find('[data-run-check]').trigger('click')
        await vi.waitUntil(() => wrapper.find('[data-unmatched]').exists(), { timeout: 3000 })
      })
      s.When('the admin dismisses it', async () => {
        await wrapper.find('[data-dismiss]').trigger('click')
      })
      s.Then('no record of it exists afterwards', async () => {
        expect(wrapper.find('[data-unmatched]').exists()).toBe(false)
        // dismissing sends nothing to the server — there is nothing to forget
        expect(assigned).toBe(false)
        expect(await everythingStored(db)).not.toContain('tx_salary')
        expect(await storedPayments(db)).toHaveLength(0)
      })
    })

    r.RuleScenario('Assigned credit becomes a payment', (s) => {
      let db: Db
      let ables = 0
      s.Given('an unmatched credit shown to the admin', async () => {
        db = await freshDb()
        ables = await seedParty(db, 'The Ables', ['Ann Able'], { night: 'of', choice: 'our_room', occupants: 2 })
      })
      s.When('the admin assigns it to a party', async () => {
        const { assignCredit } = await reconcileUtil()
        expect(await assignCredit(db, { partyId: ables, transactionId: 'tx_cardpay', amount: 42.5 })).toEqual({ ok: true })
        // the trust boundary still validates what the page sends back
        expect((await assignCredit(db, { partyId: ables, transactionId: 'tx_bad', amount: -5 })).ok).toBe(false)
        expect((await assignCredit(db, { partyId: 99999, transactionId: 'tx_ghost', amount: 5 })).ok).toBe(false)
      })
      s.Then(`a payment is recorded for that party carrying the credit's transaction id and amount`, async () => {
        expect(await storedPayments(db)).toMatchObject([{ partyId: ables, transactionId: 'tx_cardpay', amount: 42.5, matchedOn: 'assigned' }])
      })
    })
  })

  f.Rule('Reconciliation freshness is visible', (r) => {
    r.RuleScenario('Last check shown', (s) => {
      let db: Db
      let status: { available: boolean, lastChecked: string | null }
      s.Given('a previous successful check', async () => {
        db = await freshDb()
        await setLastChecked(db, '2026-09-01T08:30:00.000Z')
      })
      s.When('the admin opens the payments page', async () => {
        const { reconciliationStatus } = await reconcileUtil()
        status = await reconciliationStatus(db, CONFIG, new Date('2026-09-13T12:00:00.000Z'))
      })
      s.Then('the time of the last successful check is shown', async () => {
        expect(status).toMatchObject({ available: true, lastChecked: '2026-09-01T08:30:00.000Z' })
        const wrapper = await mountPayments({ ...status, authorised: false, stale: false })
        expect(wrapper.find('[data-last-checked]').text()).toContain('1 September 2026')
        expect(wrapper.find('[data-stale-warning]').exists()).toBe(false)
      })
    })

    r.RuleScenario('Stale check warned', (s) => {
      let db: Db
      const now = new Date('2026-09-13T12:00:00.000Z')
      const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString()
      let status: { stale: boolean }
      s.Given('a last successful check approaching ninety days old', async () => {
        db = await freshDb()
        await setLastChecked(db, daysAgo(85))
      })
      s.When('the admin opens the payments page', async () => {
        const { reconciliationStatus } = await reconcileUtil()
        status = await reconciliationStatus(db, CONFIG, now)
      })
      s.Then('the admin is warned that older transactions will become unreachable', async () => {
        expect(status.stale).toBe(true)
        const wrapper = await mountPayments({ available: true, authorised: false, lastChecked: daysAgo(85), stale: true })
        expect(wrapper.find('[data-stale-warning]').text()).toMatch(/ninety days|90 days/i)
        const { reconciliationStatus } = await reconcileUtil()
        const { settings } = await import('../../server/db/schema')
        await db.update(settings).set({ value: daysAgo(10) })
        expect((await reconciliationStatus(db, CONFIG, now)).stale).toBe(false)
      })
    })
  })
})
