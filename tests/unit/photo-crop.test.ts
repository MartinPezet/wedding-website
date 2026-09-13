import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Prod swaps @nuxt/image to the awsAmplify provider, which ignores height and
// never crops; dev's ipx does. Cropping in CSS keeps both environments identical.
describe('photo crop', () => {
  for (const page of ['index', 'gifts', 'save-the-date']) {
    it(`${page}: every NuxtImg crops via a CSS aspect ratio`, () => {
      const source = readFileSync(`app/pages/${page}.vue`, 'utf8')
      const images = source.match(/<NuxtImg[\s\S]*?\/>/g) ?? []
      expect(images.length).toBeGreaterThan(0)
      for (const image of images) {
        expect(image).toMatch(/class="[^"]*\baspect-[^"]*"/)
        expect(image).toMatch(/class="[^"]*\bobject-cover\b[^"]*"/)
      }
    })

    // a `sizes` smaller than the rendered arch makes the browser upscale a small file (blur)
    it(`${page}: sizes cover the widest the photo frame renders`, () => {
      const source = readFileSync(`app/pages/${page}.vue`, 'utf8')
      const frame = source.match(/<FloralArch[\s\S]*?class="([^"]*)"/)?.[1] ?? ''
      // Tailwind v4 spacing: w-N / max-w-N = N * 4px
      const frameWidths = [...frame.matchAll(/(?:^|\s|:)(?:max-)?w-(\d+)\b/g)].map(m => Number(m[1]) * 4)
      const sizes = source.match(/<NuxtImg[\s\S]*?sizes="([^"]*)"/)?.[1] ?? ''
      const sizeWidths = [...sizes.matchAll(/(\d+)px/g)].map(m => Number(m[1]))
      expect(frameWidths.length).toBeGreaterThan(0)
      expect(Math.max(...sizeWidths)).toBeGreaterThanOrEqual(Math.max(...frameWidths))
    })
  }

  // hero photos sit above the fold; never defer them
  for (const page of ['index', 'gifts']) {
    it(`${page}: hero photo loads eagerly`, () => {
      const source = readFileSync(`app/pages/${page}.vue`, 'utf8')
      expect(source.match(/<NuxtImg[\s\S]*?\/>/)?.[0]).toContain('loading="eager"')
    })
  }
})
