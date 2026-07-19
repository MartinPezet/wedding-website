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

  it('FloralCluster is hydrangea-only, mopheads on leafed stems', () => {
    const src = read('FloralCluster.vue')
    expect(src).toContain(FLORET)
    // stems for the mopheads (mockup c-hstem), swaying with the blooms
    expect(src, 'hstem stem path').toContain('Q-4,-46 -2,-92')
    // tulips moved to the footer corner art
    expect(src, 'no tulip cup path').not.toContain(TULIP)
    expect(src, 'no tulip tokens').not.toMatch(/var\(--color-tulip/)
    noDaisyRings(src)
  })

  it('FloralDivider centres on a whole mophead, not a floret trio', () => {
    const src = read('FloralDivider.vue')
    // first floret of the 10-floret bloom cluster marks the mophead def
    expect(src, 'bloom mophead def').toContain('translate(0,-28) rotate(10)')
  })

  it('FloralArch base ends anchor on mopheads', () => {
    const src = read('FloralArch.vue')
    // floret/mophead position swap at both arc base ends
    expect(src).toMatch(/ref_\('flb'\)" transform="translate\(20,104\)/)
    expect(src).toMatch(/ref_\('bloomX'\)" transform="translate\(1,140\)/)
    expect(src).toMatch(/ref_\('fla'\)" transform="translate\(310,104\)/)
    expect(src).toMatch(/ref_\('bloomX'\)" transform="translate\(329,140\)/)
  })
})
