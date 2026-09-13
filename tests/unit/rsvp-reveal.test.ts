import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const rsvp = readFileSync('app/pages/rsvp.vue', 'utf8')

/**
 * Every block of the RSVP form has to opt into the staged reveal — one that
 * forgets the directive simply pops in while its neighbours animate, which is
 * exactly what happened to the extras block and the submit button.
 */
describe('RSVP form reveal opt-in', () => {
  const blocks: [string, RegExp][] = [
    ['greeting', /<p v-reveal class="text-center text-leaf-deep">/],
    ['guest fieldsets', /<fieldset\s+v-for="guest in guests"[\s\S]{0,120}?v-reveal/],
    ['room booking section', /<section v-if="anyAttending" v-reveal/],
    ['song and note extras', /<div v-reveal class="mt-8 flex flex-col gap-3">/],
    ['submit button', /<button\s+v-reveal\s+type="submit"/],
  ]

  for (const [name, pattern] of blocks) {
    it(`${name} reveals`, () => {
      expect(rsvp).toMatch(pattern)
    })
  }
})
