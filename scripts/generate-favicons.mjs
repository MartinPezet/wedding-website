// Generates public/favicon.svg, favicon.png, and apple-touch-icon.png from
// the @theme palette in app/assets/css/main.css, so a palette swap (1a -> 1b)
// recolours the favicon with a single `npm run favicons`.
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

const css = readFileSync('app/assets/css/main.css', 'utf8')
const color = (name) => {
  const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
  if (!m) throw new Error(`--color-${name} not found in main.css @theme`)
  return m[1]
}

// hydrangea mophead (design-system c-bloom): 10 four-petal florets in three
// tints with gold-soft centres
const floret = (id, fill) =>
  `<g id="${id}">`
  + [0, 90, 180, 270].map(a =>
    `<use href="#fp" transform="rotate(${a})" fill="${fill}"/>`).join('')
  + `<circle r="2.6" fill="${color('gold-soft')}"/></g>`

const bloom = [
  ['flb', 'translate(0,-28) rotate(10)'],
  ['fla', 'translate(24,-16) rotate(40) scale(0.92)'],
  ['flc', 'translate(29,8) rotate(-20) scale(0.85)'],
  ['fla', 'translate(12,27) rotate(25) scale(0.95)'],
  ['flb', 'translate(-13,28) rotate(-35) scale(0.9)'],
  ['flc', 'translate(-28,9) rotate(15) scale(0.88)'],
  ['fla', 'translate(-25,-17) rotate(-42) scale(0.94)'],
  ['flc', 'translate(-9,-8) rotate(30) scale(0.8)'],
  ['flb', 'translate(11,-4) rotate(-15) scale(1.05)'],
  ['fla', 'translate(0,12) rotate(55) scale(0.75)'],
].map(([id, t]) => `<use href="#${id}" transform="${t}"/>`).join('\n  ')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92">
  <!-- hydrangea mophead from the design system; generated from main.css @theme by scripts/generate-favicons.mjs -->
  <defs>
    <path id="fp" d="M0,1.5 C-5.5,-1.5 -6.5,-11 0,-15.5 C6.5,-11 5.5,-1.5 0,1.5 Z"/>
    ${floret('fla', color('petal-soft'))}
    ${floret('flb', color('petal'))}
    ${floret('flc', color('petal-mid'))}
  </defs>
  ${bloom}
</svg>
`

writeFileSync('public/favicon.svg', svg)
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile('public/favicon.png')
// apple-touch-icon must be opaque: cream background behind the bloom
const opaque = svg.replace('<defs>', `<rect x="-42" y="-42" width="84" height="84" fill="${color('cream')}"/><defs>`)
await sharp(Buffer.from(opaque)).resize(180, 180).png().toFile('public/apple-touch-icon.png')

console.log('favicons generated from main.css palette')
