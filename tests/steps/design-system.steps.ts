// @vitest-environment nuxt
import { readFileSync, readdirSync } from 'node:fs'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'

const page = async (name: string) => (await import(`../../app/pages/${name}.vue`)).default

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const css = () => readFileSync('app/assets/css/main.css', 'utf8')

// Floral components + the hero pages that carry floral art / clipped photos.
const themedSources = () => [
  ...readdirSync('app/components')
    .filter((f) => /^Floral.*\.vue$/.test(f))
    .map((f) => `app/components/${f}`),
  'app/pages/index.vue',
  'app/pages/gifts.vue',
]

const feature = await loadFeature('tests/features/design-system.feature')

describeFeature(feature, (f) => {
  f.Rule('Theme tokens drive all colours and fonts', (r) => {
    r.RuleScenario('Tulip triad tokens exist', (s) => {
      let text = ''
      s.Given('the theme block in app/assets/css/main.css', () => {
        text = css()
      })
      s.When('the tokens are read', () => {})
      s.Then('--color-tulip, --color-tulip-mid, and --color-tulip-deep are defined', () => {
        for (const name of ['tulip', 'tulip-mid', 'tulip-deep']) {
          expect(text, `--color-${name} defined`).toMatch(
            new RegExp(`--color-${name}:\\s*#[0-9a-fA-F]{6}`),
          )
        }
      })
    })

    r.RuleScenario('No hardcoded colours in components', (s) => {
      let sources: string[] = []
      s.Given('the floral components and page templates', () => {
        sources = themedSources()
        expect(sources.length).toBeGreaterThan(0)
      })
      s.When('their markup is inspected', () => {})
      s.Then('no literal hex colour appears outside the theme block', () => {
        for (const path of sources) {
          const src = readFileSync(path, 'utf8')
          const hex = src.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g)
          expect(hex, `${path} has no literal hex colour`).toBeNull()
        }
      })
    })
  })

  f.Rule('Typography pairing', (r) => {
    r.RuleScenario('Fonts are self-hosted', (s) => {
      let text = ''
      s.Given('the app stylesheet', () => {
        text = css()
      })
      s.When('its font imports are inspected', () => {})
      s.Then('Fraunces and Inter load from @fontsource with no external font request', () => {
        expect(text).toContain('@fontsource-variable/fraunces')
        expect(text).toContain('@fontsource-variable/inter')
        expect(text).not.toContain('fonts.googleapis.com')
      })
    })
  })

  f.Rule('Hero floral arch', (r) => {
    r.RuleScenario('Arch crowns the home and gifts heroes', (s) => {
      const html: Record<string, string> = {}
      s.Given('the / and /gifts pages', () => {})
      s.When('each renders', async () => {
        html.index = (await mountSuspended(await page('index'))).html()
        html.gifts = (await mountSuspended(await page('gifts'))).html()
      })
      s.Then('the hero photo is clipped and a decorative arch crowns it', () => {
        for (const [name, markup] of Object.entries(html)) {
          expect(markup, `${name}: floral arch present`).toContain('floral-arch')
          expect(markup, `${name}: hero photo clipped`).toMatch(/clip-path/)
          expect(markup, `${name}: arch is decorative`).toContain('aria-hidden')
        }
      })
    })
  })
})
