import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The mockup 2a florals are hydrangea florets (4-petal cross) and tulip cups,
// not the old daisy rings. Guard the shape language by unique path signatures.
const read = (name: string) => readFileSync(`app/components/${name}`, 'utf8')
const FLORET = '-6.5,-11 0,-15.5' // hydrangea floret petal
const TULIP = '-12,-26 0,-34' // tulip cup petal

const noDaisyRings = (src: string) => {
  expect(src, 'no ring8/ring5 daisy defs').not.toMatch(/ring8|ring5/)
  expect(src, 'no 45/72-degree daisy ring generator').not.toMatch(/\(i - 1\) \* (?:45|72)/)
}

describe('floral glyphs use hydrangea florets + tulip cups', () => {
  it('FloralBloom is a hydrangea mophead', () => {
    const src = read('FloralBloom.vue')
    expect(src).toContain(FLORET)
    noDaisyRings(src)
  })

  it('FloralDivider uses hydrangea florets', () => {
    const src = read('FloralDivider.vue')
    expect(src).toContain(FLORET)
    noDaisyRings(src)
  })

  it('FloralCluster uses hydrangea florets and tulip cups', () => {
    const src = read('FloralCluster.vue')
    expect(src).toContain(FLORET)
    expect(src).toContain(TULIP)
    expect(src).toMatch(/var\(--color-tulip/)
    noDaisyRings(src)
  })
})
