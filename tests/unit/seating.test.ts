import { describe, expect, it } from 'vitest'

// variable path so a missing module fails tests, not collection
const seating = async () => await import(`../../shared/utils/${'seating'}.ts`)

describe('seatPositions', () => {
  it('round table spreads capacity seats evenly on a circle', async () => {
    const { seatPositions } = await seating()
    const seats = seatPositions('round', 10)
    expect(seats).toHaveLength(10)
    const distances = seats.map(seat => Math.hypot(seat.x, seat.y))
    for (const distance of distances) expect(distance).toBeCloseTo(distances[0]!, 5)
    const keys = new Set(seats.map(seat => `${seat.x.toFixed(2)},${seat.y.toFixed(2)}`))
    expect(keys.size).toBe(10)
  })

  it('rect table splits seats across the two long sides', async () => {
    const { seatPositions } = await seating()
    const seats = seatPositions('rect', 6)
    expect(seats).toHaveLength(6)
    expect(seats.filter(seat => seat.y < 0)).toHaveLength(3)
    expect(seats.filter(seat => seat.y > 0)).toHaveLength(3)
  })

  it('odd rect capacity puts the extra seat on top', async () => {
    const { seatPositions } = await seating()
    const seats = seatPositions('rect', 7)
    expect(seats.filter(seat => seat.y < 0)).toHaveLength(4)
    expect(seats.filter(seat => seat.y > 0)).toHaveLength(3)
  })

  it('capacity change recomputes seat count', async () => {
    const { seatPositions } = await seating()
    expect(seatPositions('round', 8)).toHaveLength(8)
  })
})
