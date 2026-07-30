// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generatePartyToken } from '../../server/utils/token'

describe('generatePartyToken', () => {
  it('produces 10-character Crockford base32 tokens, hand-transcribable and unambiguous', () => {
    const token = generatePartyToken()
    expect(token).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/)
  })

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 100 }, generatePartyToken))
    expect(tokens.size).toBe(100)
  })
})
