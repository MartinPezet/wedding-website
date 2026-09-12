import { describe, expect, it } from 'vitest'
import { rooms } from '#shared/content'
import { PAYMENT_REFERENCE_PREFIX, monzoLink, paymentReference, roomPrice, roomTotal } from '#shared/utils/rooms'

describe('rooms.json', () => {
  it('carries a Monzo payment URL and both nights of pricing', () => {
    expect(rooms.paymentUrl).toMatch(/^https:\/\//)
    expect(rooms.prices.before.perPerson).toBe(95)
    expect(rooms.prices.of.ourRoom).toBe(160)
    expect(rooms.prices.of.perPerson).toBe(80)
  })
})

describe('roomPrice', () => {
  it('charges a flat rate per own room on the night of', () => {
    expect(roomPrice('of', 'our_room', 1)).toBe(160)
    expect(roomPrice('of', 'our_room', 2)).toBe(160)
  })

  it('charges per person for shares on the night of, own person only', () => {
    expect(roomPrice('of', 'share_named')).toBe(80)
    expect(roomPrice('of', 'share_match')).toBe(80)
  })

  it('charges per person for every choice on the night before', () => {
    expect(roomPrice('before', 'our_room', 1)).toBe(95)
    expect(roomPrice('before', 'our_room', 2)).toBe(190)
    expect(roomPrice('before', 'share_named')).toBe(95)
    expect(roomPrice('before', 'share_match')).toBe(95)
  })
})

describe('roomTotal', () => {
  it('is zero with no rooms', () => {
    expect(roomTotal([])).toBe(0)
  })

  it('sums both nights', () => {
    expect(roomTotal([
      { night: 'of', choice: 'our_room', occupants: 2 },
      { night: 'of', choice: 'share_named', occupants: 1 },
      { night: 'before', choice: 'our_room', occupants: 2 },
      { night: 'before', choice: 'share_match', occupants: 1 },
    ])).toBe(160 + 80 + 190 + 95)
  })
})

describe('payment link', () => {
  it('references the party', () => {
    expect(paymentReference(12)).toBe(`${PAYMENT_REFERENCE_PREFIX}12`)
  })

  it('pre-fills the Monzo link with amount and reference', () => {
    const link = new URL(monzoLink(540, 12))
    // monzo.me takes the amount as a path segment; as a query param it is ignored
    expect(link.pathname).toBe(`${new URL(rooms.paymentUrl).pathname}/540`)
    expect(link.searchParams.get('amount')).toBeNull()
    expect(link.searchParams.get('d')).toBe(paymentReference(12))
  })

  it('leaves the path alone when nothing is owed', () => {
    expect(new URL(monzoLink(0, 12)).pathname).toBe(new URL(rooms.paymentUrl).pathname)
  })

  it('keeps the query string the stored link already carries', () => {
    // the joint-account link routes on its own params — dropping them would
    // silently send every payment to the wrong account
    const stored = new URL(rooms.paymentUrl)
    const link = new URL(monzoLink(540, 12))
    expect(link.origin).toBe(stored.origin)
    expect(link.pathname.startsWith(stored.pathname)).toBe(true)
    for (const [key, value] of stored.searchParams) {
      expect(link.searchParams.get(key)).toBe(value)
    }
  })
})
