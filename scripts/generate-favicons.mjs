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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-42 -42 84 84">
  <!-- a-bloom from the design system; generated from main.css @theme by scripts/generate-favicons.mjs -->
  <defs>
    <path id="pt" d="M0,3 C-13,-4 -15,-27 0,-38 C15,-27 13,-4 0,3 Z"/>
    <g id="ring">
      <use href="#pt"/>
      <use href="#pt" transform="rotate(45)"/>
      <use href="#pt" transform="rotate(90)"/>
      <use href="#pt" transform="rotate(135)"/>
      <use href="#pt" transform="rotate(180)"/>
      <use href="#pt" transform="rotate(225)"/>
      <use href="#pt" transform="rotate(270)"/>
      <use href="#pt" transform="rotate(315)"/>
    </g>
  </defs>
  <use href="#ring" fill="${color('petal-soft')}"/>
  <use href="#ring" transform="rotate(22.5) scale(0.64)" fill="${color('petal-mid')}"/>
  <use href="#ring" transform="scale(0.34)" fill="${color('petal')}"/>
  <circle r="5" fill="${color('petal-deep')}"/>
</svg>
`

writeFileSync('public/favicon.svg', svg)
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile('public/favicon.png')
// apple-touch-icon must be opaque: cream background behind the bloom
const opaque = svg.replace('<defs>', `<rect x="-42" y="-42" width="84" height="84" fill="${color('cream')}"/><defs>`)
await sharp(Buffer.from(opaque)).resize(180, 180).png().toFile('public/apple-touch-icon.png')

console.log('favicons generated from main.css palette')
