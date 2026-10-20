// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_MESSAGE, fillMessage, smsHref, whatsappHref } from '../../shared/utils/messages'

describe('fillMessage', () => {
  const values = { name: 'The Smiths', link: 'https://x.test/?t=abc', food_link: 'https://x.test/menu?t=abc' }

  it('fills every {name}, {link} and {food_link}', () => {
    expect(fillMessage('{name}! {link} {food_link} — see you, {name}', values))
      .toBe('The Smiths! https://x.test/?t=abc https://x.test/menu?t=abc — see you, The Smiths')
  })

  it('leaves unknown placeholders as typed', () => {
    expect(fillMessage('Hi {name}, {nope}', values)).toBe('Hi The Smiths, {nope}')
  })

  it('inserts $ sequences in values literally', () => {
    expect(fillMessage('Hi {name}', { name: 'Jo $& Sam' })).toBe('Hi Jo $& Sam')
  })

  it('default reminder mentions both placeholders', () => {
    expect(DEFAULT_MESSAGE).toContain('{name}')
    expect(DEFAULT_MESSAGE).toContain('{link}')
  })
})

describe('smsHref', () => {
  it('addresses the number with an encoded body both iOS and Android read', () => {
    expect(smsHref('+447911123456', 'Hi & bye\nx')).toBe('sms:+447911123456?&body=Hi%20%26%20bye%0Ax')
  })
})

describe('whatsappHref', () => {
  it('uses the number without + and an encoded text', () => {
    expect(whatsappHref('+447911123456', 'Hi & bye')).toBe('https://wa.me/447911123456?text=Hi%20%26%20bye')
  })
})
