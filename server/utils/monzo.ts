import { randomUUID } from 'node:crypto'
import type { SecureSessionData } from '#auth-utils'
import type { H3Event } from 'h3'

export interface MonzoConfig {
  monzoClientId: string
  monzoClientSecret: string
}

/** shaped like $fetch; injectable so tests never reach api.monzo.com */
export type MonzoFetcher = (url: string, options?: {
  method?: string
  headers?: Record<string, string>
  query?: Record<string, unknown>
  body?: unknown
}) => Promise<unknown>

const AUTH_URL = 'https://auth.monzo.com/'
const API = 'https://api.monzo.com'
/** Monzo caps a transactions page at 100 */
const PAGE_SIZE = 100
/** past five minutes after authorising, Monzo refuses anything older than ninety days */
const HISTORY_DAYS = 89

const defaultFetcher = (...args: Parameters<MonzoFetcher>) => ($fetch as unknown as MonzoFetcher)(...args)

export const monzoConfigured = (config: MonzoConfig) => Boolean(config.monzoClientId && config.monzoClientSecret)

export function authorisationUrl(config: MonzoConfig, redirectUri: string, state: string): string {
  if (!monzoConfigured(config)) throw new Error('Monzo client credentials are not configured.')
  const url = new URL(AUTH_URL)
  url.search = new URLSearchParams({
    client_id: config.monzoClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  }).toString()
  return url.toString()
}

export type AuthorisationResult = { ok: true, token: string } | { ok: false, error: string }

const callbackUrl = (event: H3Event) =>
  `${getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin}/api/admin/monzo/callback`

/** rewrites the sealed, server-only half of the admin session */
async function updateSecureSession(event: H3Event, change: (secure: SecureSessionData) => void) {
  const { id: _id, ...session } = await getUserSession(event)
  const secure = { ...session.secure }
  change(secure)
  await replaceUserSession(event, { ...session, secure })
}

/** Starts a check: remembers a one-off state in the sealed session and returns Monzo's consent URL. */
export async function beginAuthorisation(event: H3Event, config: MonzoConfig): Promise<string> {
  const state = randomUUID()
  await setUserSession(event, { secure: { monzoState: state } })
  return authorisationUrl(config, callbackUrl(event), state)
}

/**
 * Monzo's callback: swaps the code for a token held only in the sealed session
 * until the check runs. The state is single-use whatever the outcome.
 */
export async function finishAuthorisation(event: H3Event, config: MonzoConfig): Promise<AuthorisationResult> {
  const { secure } = await getUserSession(event)
  const result = await completeAuthorisation(config, callbackUrl(event), getQuery(event), secure?.monzoState)
    .catch((): AuthorisationResult => ({ ok: false, error: 'Monzo could not be reached.' }))
  await updateSecureSession(event, (next) => {
    delete next.monzoState
    delete next.monzoToken
    if (result.ok) next.monzoToken = result.token
  })
  return result
}

/** Drops the Monzo token — a check's authorisation never outlives the check. */
export async function forgetMonzoToken(event: H3Event) {
  await updateSecureSession(event, (next) => {
    delete next.monzoToken
  })
}

/**
 * Turns the OAuth callback into an access token. A declined authorisation or a
 * callback not answering this session's own request stops here, before any
 * call to Monzo is made.
 */
export async function completeAuthorisation(
  config: MonzoConfig,
  redirectUri: string,
  query: { code?: unknown, state?: unknown, error?: unknown },
  expectedState: string | undefined,
  fetcher: MonzoFetcher = defaultFetcher,
): Promise<AuthorisationResult> {
  if (query.error) return { ok: false, error: 'Monzo authorisation was declined.' }
  if (!expectedState || query.state !== expectedState || typeof query.code !== 'string' || !query.code) {
    return { ok: false, error: 'That Monzo authorisation did not come from this admin session.' }
  }
  const response = await fetcher(`${API}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.monzoClientId,
      client_secret: config.monzoClientSecret,
      redirect_uri: redirectUri,
      code: query.code,
    }),
  }) as { access_token?: unknown }
  if (typeof response?.access_token !== 'string') return { ok: false, error: 'Monzo did not issue an access token.' }
  return { ok: true, token: response.access_token }
}

export interface MonzoCredit {
  transactionId: string
  /** pounds */
  amount: number
  created: string
  /** everything the payer typed or the bank supplied as a reference */
  reference: string
  payerName: string | null
}

interface MonzoTransaction {
  id: string
  /** pence; negative for money leaving the account */
  amount: number
  created: string
  description?: string
  notes?: string
  counterparty?: { name?: string }
}

/**
 * One pass over the joint account's transactions since `since`, returning only
 * incoming credits. Debits never leave this function — the couple's spending is
 * not the wedding site's business.
 */
export async function fetchCredits(token: string, since: string | undefined, fetcher: MonzoFetcher = defaultFetcher): Promise<MonzoCredit[]> {
  const headers = { Authorization: `Bearer ${token}` }
  const { accounts } = await fetcher(`${API}/accounts`, { headers, query: { account_type: 'uk_retail_joint' } }) as { accounts: { id: string, closed: boolean }[] }
  const account = accounts.find(entry => !entry.closed)
  if (!account) throw new Error('No open Monzo joint account was found.')

  // older than the history window is unreachable anyway; asking for it fails the whole fetch
  const floor = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString()
  let cursor = since && since > floor ? since : floor
  const transactions: MonzoTransaction[] = []
  for (;;) {
    const { transactions: page } = await fetcher(`${API}/transactions`, {
      headers,
      query: { account_id: account.id, since: cursor, limit: PAGE_SIZE },
    }) as { transactions: MonzoTransaction[] }
    transactions.push(...page)
    if (page.length < PAGE_SIZE) break
    // Monzo pages forward from the last transaction id seen
    cursor = page.at(-1)!.id
  }

  return transactions
    .filter(transaction => transaction.amount > 0)
    .map(transaction => ({
      transactionId: transaction.id,
      amount: transaction.amount / 100,
      created: transaction.created,
      reference: [transaction.description, transaction.notes].filter(Boolean).join(' '),
      payerName: transaction.counterparty?.name ?? null,
    }))
}
