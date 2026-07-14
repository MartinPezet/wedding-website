export type TableShape = 'round' | 'rect'

export interface SeatPosition {
  x: number
  y: number
}

/** logical canvas size; screen and print are scale transforms of it */
export const CANVAS = { width: 1000, height: 700 } as const

export const ROUND_TABLE_RADIUS = 34
export const SEAT_RADIUS = 9
const SEAT_GAP = 12

/** rect table body size, wide enough for its top-row seats */
export function rectSize(capacity: number) {
  const perSide = Math.ceil(capacity / 2)
  return { width: Math.max(70, perSide * (SEAT_RADIUS * 2 + 8)), height: 44 }
}

/**
 * Seat coordinates relative to the table centre, index order stable for a
 * given shape + capacity. Positions are computed, never stored.
 */
export function seatPositions(shape: TableShape, capacity: number): SeatPosition[] {
  if (shape === 'round') {
    const radius = ROUND_TABLE_RADIUS + SEAT_GAP
    return Array.from({ length: capacity }, (_, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / capacity
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
    })
  }
  // rect: extra seat goes on top; seats spread evenly along each long side
  const top = Math.ceil(capacity / 2)
  const bottom = capacity - top
  const { width, height } = rectSize(capacity)
  const rowY = height / 2 + SEAT_GAP
  const row = (count: number, y: number) =>
    Array.from({ length: count }, (_, index) => ({
      x: (index + 0.5) * (width / count) - width / 2,
      y,
    }))
  return [...row(top, -rowY), ...row(bottom, rowY)]
}
