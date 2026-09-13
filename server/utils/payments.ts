import { eq, sum } from 'drizzle-orm'
import { payments } from '../db/schema'
import type { Db } from './db'

export type MatchedOn = typeof payments.$inferInsert['matchedOn']

export interface PaymentInput {
  partyId: number
  /** Monzo transaction id; null for a payment the admin entered by hand */
  transactionId: string | null
  amount: number
  matchedOn: MatchedOn
}

/** pounds, rounded to the penny so float sums never drift */
export const pennies = (amount: number) => Math.round(amount * 100) / 100

/** false when this Monzo transaction was already recorded — a re-run never double-counts */
export async function recordPayment(db: Db, payment: PaymentInput): Promise<boolean> {
  const inserted = await db.insert(payments)
    .values({ ...payment, amount: pennies(payment.amount), seenAt: new Date().toISOString() })
    .onConflictDoNothing({ target: payments.transactionId })
    .returning({ id: payments.id })
  return inserted.length > 0
}

export async function amountPaidFor(db: Db, partyId: number): Promise<number> {
  const [row] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.partyId, partyId))
  return pennies(Number(row?.total ?? 0))
}
