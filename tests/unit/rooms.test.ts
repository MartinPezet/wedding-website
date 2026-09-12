import { describe, expect, it } from 'vitest'
import { rooms } from '#shared/content'
import { PAYMENT_REFERENCE_PREFIX, monzoLink, paymentReference, roomPrice, roomTotal } from '#shared/utils/rooms'

describe('rooms.json', () => {
  it('carries a Monzo handle and both nights of pricing', () => {
    expect(rooms.monzoHandle).toEqual(expect.any(String))
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
    const link = monzoLink(540, 12)
    expect(link).toContain(`monzo.me/${rooms.monzoHandle}`)
    expect(link).toContain('amount=540')
    expect(link).toContain(encodeURIComponent(paymentReference(12)))
  })
})
