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

/**
 * The own-room option is worded for the party reading it — "just me" alone,
 * "just us" as a pair, "some of us" once a party is big enough that a room
 * holds only part of it. Omit the size for a neutral label (admin, exports).
 */
export function roomChoiceLabel(choice: RoomChoice, attending?: number): string {
  if (choice !== 'our_room' || attending === undefined) return ROOM_CHOICE_LABELS[choice]
  if (attending <= 1) return 'A room for just me'
  if (attending === 2) return 'A room for just us'
  return 'A whole room for some of us'
}

/**
 * One room is all a party of one or two can need; beyond that a party may book
 * up to one room per attending guest.
 */
export function maxRoomsPerNight(attending: number): number {
  return attending > 2 ? attending : 1
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
