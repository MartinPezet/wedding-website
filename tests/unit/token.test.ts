// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generatePartyToken } from '../../server/utils/token'

describe('generatePartyToken', () => {
  it('produces URL-safe tokens from 32 random bytes', () => {
    const token = generatePartyToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
  })

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 100 }, generatePartyToken))
    expect(tokens.size).toBe(100)
  })
})
