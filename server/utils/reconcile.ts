import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { PAYMENT_REFERENCE_PREFIX } from '#shared/utils/rooms'
import { parties, payments, settings } from '../db/schema'
import { getPartyList } from './admin'
import type { Db } from './db'
import { fetchCredits, forgetMonzoToken, monzoConfigured } from './monzo'
import type { MonzoConfig, MonzoCredit, MonzoFetcher } from './monzo'
import { pennies, recordPayment } from './payments'
import type { MatchedOn } from './payments'

const LAST_CHECKED_KEY = 'monzo_last_checked'
/** Monzo stops serving transactions at ninety days; warn with time left to act */
const STALE_AFTER_DAYS = 75

export async function getLastChecked(db: Db): Promise<string | undefined> {
  const row = await db.query.settings.findFirst({ where: eq(settings.key, LAST_CHECKED_KEY) })
  return row?.value
}

export async function reconciliationStatus(db: Db, config: MonzoConfig, now = new Date()) {
  const lastChecked = await getLastChecked(db) ?? null
  const ageInDays = lastChecked ? (now.getTime() - Date.parse(lastChecked)) / 86_400_000 : 0
  return { available: monzoConfigured(config), lastChecked, stale: ageInDays >= STALE_AFTER_DAYS }
}

interface PartyBalance {
  id: number
  name: string
  guestNames: string[]
  outstanding: number
}

const REFERENCE = new RegExp(`${PAYMENT_REFERENCE_PREFIX}(\\d+)`, 'i')
const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'mx', 'dr'])

const words = (name: string) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean)

/** banks send "MR A ABLE" as often as "Ann Able": surname plus first name or its initial */
function payerIsGuest(payer: string, guest: string) {
  const payerWords = words(payer).filter(word => !TITLES.has(word))
  const guestWords = words(guest)
  const first = guestWords[0]
  const last = guestWords.at(-1)
  // a lone first name is too common to identify anyone
  if (!first || !last || guestWords.length < 2) return false
  return payerWords.includes(last)
    && payerWords.some(word => word === first || (word.length === 1 && word === first[0]))
}

/**
 * Reference first (unique and pre-filled), then payer name, then amount —
 * which only ever confirms: it narrows parties tied on name, or picks the one
 * party owing exactly this much. A tie is never resolved by guessing.
 */
function matchCredit(credit: MonzoCredit, balances: PartyBalance[]): { party: PartyBalance, matchedOn: MatchedOn } | null {
  const referenced = balances.find(party => party.id === Number(REFERENCE.exec(credit.reference)?.[1]))
  if (referenced) return { party: referenced, matchedOn: 'reference' }

  const payer = credit.payerName
  const named = payer ? balances.filter(party => party.guestNames.some(guest => payerIsGuest(payer, guest))) : []
  if (named.length === 1) return { party: named[0]!, matchedOn: 'name' }

  const owing = (named.length ? named : balances)
    .filter(party => party.outstanding > 0 && party.outstanding === pennies(credit.amount))
  if (owing.length === 1) return { party: owing[0]!, matchedOn: named.length ? 'name' : 'amount' }
  return null
}

export interface ReconcileResult {
  checkedAt: string
  matched: { transactionId: string, partyId: number, partyName: string, amount: number, matchedOn: MatchedOn }[]
  /** handed to the admin once and never written anywhere — the account carries non-wedding income */
  unmatched: MonzoCredit[]
}

export async function runReconciliation(
  db: Db,
  fetchCredits: (since?: string) => Promise<MonzoCredit[]>,
  now = new Date(),
): Promise<ReconcileResult> {
  const credits = await fetchCredits(await getLastChecked(db))

  const recorded = new Set((await db.select({ id: payments.transactionId }).from(payments)).map(row => row.id))
  const balances: PartyBalance[] = (await getPartyList(db)).map(party => ({
    id: party.id,
    name: party.name,
    guestNames: party.guests.map(guest => guest.name),
    outstanding: pennies(party.roomTotal - party.amountPaid),
  }))

  const result: ReconcileResult = { checkedAt: now.toISOString(), matched: [], unmatched: [] }
  for (const credit of credits) {
    // already accounted for by an earlier run or an assignment
    if (recorded.has(credit.transactionId)) continue
    const match = matchCredit(credit, balances)
    if (!match) {
      result.unmatched.push(credit)
      continue
    }
    await recordPayment(db, { partyId: match.party.id, transactionId: credit.transactionId, amount: credit.amount, matchedOn: match.matchedOn })
    match.party.outstanding = pennies(match.party.outstanding - credit.amount)
    result.matched.push({
      transactionId: credit.transactionId,
      partyId: match.party.id,
      partyName: match.party.name,
      amount: credit.amount,
      matchedOn: match.matchedOn,
    })
  }

  // only a run that got this far moves the window on
  await db.insert(settings).values({ key: LAST_CHECKED_KEY, value: result.checkedAt })
    .onConflictDoUpdate({ target: settings.key, set: { value: result.checkedAt } })
  return result
}

/**
 * One reconciliation with the token the Monzo callback left in the sealed
 * session; the token is dropped as soon as the run ends.
 */
export async function checkPayments(event: H3Event, db: Db, fetcher?: MonzoFetcher): Promise<ReconcileResult> {
  const token = (await getUserSession(event)).secure?.monzoToken
  if (!token) throw createError({ statusCode: 409, message: 'Connect Monzo before running a check.' })

  try {
    const result = await runReconciliation(db, since => fetchCredits(token, since, fetcher))
    await forgetMonzoToken(event)
    return result
  }
  catch (error) {
    // Monzo answers 403 until the admin approves access in the app — keep the token so they can retry
    const { statusCode, status } = error as { statusCode?: number, status?: number }
    const awaitingApproval = statusCode === 403 || status === 403
    if (!awaitingApproval) await forgetMonzoToken(event)
    throw createError({
      cause: error,
      statusCode: awaitingApproval ? 403 : 502,
      message: awaitingApproval
        ? 'Approve access in the Monzo app, then run the check again.'
        : 'The Monzo check failed. The last-checked time is unchanged, so the next check covers the same period.',
    })
  }
}

/** Records an unmatched credit the admin has attributed to a party by hand. */
export async function assignCredit(db: Db, input: unknown): Promise<{ ok: true } | { ok: false, error: string }> {
  const { partyId, transactionId, amount } = (input ?? {}) as Record<string, unknown>
  if (typeof transactionId !== 'string' || !transactionId.trim() || transactionId.length > 100) {
    return { ok: false, error: 'Unknown transaction.' }
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'The amount must be more than zero.' }
  }
  const party = Number.isInteger(partyId)
    ? await db.query.parties.findFirst({ where: eq(parties.id, partyId as number) })
    : undefined
  if (!party) return { ok: false, error: 'Choose a party to assign this payment to.' }

  const recordedNow = await recordPayment(db, { partyId: party.id, transactionId, amount, matchedOn: 'assigned' })
  return recordedNow ? { ok: true } : { ok: false, error: 'That payment has already been recorded.' }
}
