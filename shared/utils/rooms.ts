import { rooms } from '../content'
import type { RoomChoice, RoomNight } from '../content'

/** every room request needs enough to price it; stored rows carry more */
export interface PricedRoom {
  night: RoomNight
  choice: RoomChoice
  occupants: number
}

export const ROOM_NIGHTS = ['before', 'of'] as const satisfies readonly RoomNight[]
export const ROOM_CHOICES = ['our_room', 'share_named', 'share_match'] as const satisfies readonly RoomChoice[]

export const ROOM_NIGHT_LABELS: Record<RoomNight, string> = {
  before: 'The night before',
  of: 'The night of the wedding',
}

export const ROOM_CHOICE_LABELS: Record<RoomChoice, string> = {
  our_room: 'A room for us',
  share_named: 'Sharing with someone from another party',
  share_match: 'Match us with another guest',
}

export const PAYMENT_REFERENCE_PREFIX = 'RSVP-'

/**
 * Night of: an own room is a flat rate however many of the party sleep in it;
 * a share charges per person and only the party's own person is theirs to pay.
 * Night before: per person for every choice (dinner + breakfast).
 */
export function roomPrice(night: RoomNight, choice: RoomChoice, occupants = 1): number {
  const people = choice === 'our_room' ? occupants : 1
  if (night === 'of') {
    return choice === 'our_room' ? rooms.prices.of.ourRoom : rooms.prices.of.perPerson * people
  }
  return rooms.prices.before.perPerson * people
}

export function roomTotal(requests: PricedRoom[]): number {
  return requests.reduce((total, room) => total + roomPrice(room.night, room.choice, room.occupants), 0)
}

/** stable per party — one payment can cover several rooms across both nights */
export function paymentReference(partyId: number): string {
  return `${PAYMENT_REFERENCE_PREFIX}${partyId}`
}

export function monzoLink(total: number, partyId: number): string {
  return `https://monzo.me/${rooms.monzoHandle}?amount=${total}&d=${encodeURIComponent(paymentReference(partyId))}`
}
