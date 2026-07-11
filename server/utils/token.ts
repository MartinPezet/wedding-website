import { randomBytes } from 'node:crypto'

/** Unguessable party token for QR invite URLs: 32 random bytes, base64url. */
export function generatePartyToken(): string {
  return randomBytes(32).toString('base64url')
}
