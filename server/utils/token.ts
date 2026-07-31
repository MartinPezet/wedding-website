import { randomInt } from 'node:crypto'

// Crockford base32: digits + A-Z minus I, L, O, U — no ambiguous glyphs,
// case-insensitive by convention, so a guest can type it in by hand.
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const TOKEN_LENGTH = 10

/** Party token for QR invite URLs: 10-char Crockford base32, hand-transcribable. */
export function generatePartyToken(): string {
  return Array.from(
    { length: TOKEN_LENGTH },
    () => CROCKFORD_ALPHABET[randomInt(CROCKFORD_ALPHABET.length)],
  ).join('')
}
