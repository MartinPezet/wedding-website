import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// favicons are generated from the @theme palette (npm run favicons);
// this guards against the palette changing without regenerating them
describe('favicon', () => {
  const css = readFileSync('app/assets/css/main.css', 'utf8')
  const token = (name: string) => {
    const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
    expect(m, `--color-${name} in main.css`).not.toBeNull()
    return m![1]!
  }

  it('favicon.svg is a hydrangea mophead in theme palette colours', () => {
    const svg = readFileSync('public/favicon.svg', 'utf8').toLowerCase()
    // hydrangea floret petal, not the old daisy petal
    expect(svg, 'floret petal path').toContain('-6.5,-11 0,-15.5')
    for (const name of ['petal-soft', 'petal', 'petal-mid', 'gold-soft']) {
      expect(svg, `favicon carries --color-${name}`).toContain(token(name).toLowerCase())
    }
  })
})
