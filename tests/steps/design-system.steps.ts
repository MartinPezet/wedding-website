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

  f.Rule('Floral art with gentle motion', (r) => {
    r.RuleScenario('Tulips live in the footer corners', (s) => {
      let layout = ''
      let cluster = ''
      s.Given('the site footer and the floral cluster component', () => {
        layout = readFileSync('app/layouts/default.vue', 'utf8')
        cluster = readFileSync('app/components/FloralCluster.vue', 'utf8')
      })
      s.When('their markup is inspected', () => {})
      s.Then('tulip corner art renders in the footer and no tulip glyphs remain in the cluster', () => {
        expect(layout, 'footer places tulip corner art').toContain('FloralTulipCorner')
        // tulip cup path signature must be gone from the cluster
        expect(cluster, 'cluster is hydrangea-only').not.toContain('-12,-26 0,-34')
      })
    })
  })

  f.Rule('Themed form controls', (r) => {
    const rsvp = () => readFileSync('app/pages/rsvp.vue', 'utf8')

    r.RuleScenario('Radio selected state is a floret', (s) => {
      let src = ''
      s.Given('the RSVP attendance radios', () => {
        src = rsvp()
      })
      s.When('their markup is inspected', () => {})
      s.Then('the selected state renders a hydrangea floret glyph instead of a browser-default solid dot', () => {
        // native input stays in the tree (a11y) but is visually replaced
        expect(src, 'no stock accent-color radios').not.toContain('accent-petal')
        expect(src, 'hidden native input').toMatch(/type="radio"[\s\S]{0,200}?class="peer sr-only"/)
        // the floret petal path drawn for the checked state
        expect(src, 'floret glyph').toContain('-6.5,-11 0,-15.5')
        expect(src, 'checked state reveals the floret').toContain('peer-checked:')
      })
    })

    r.RuleScenario('Dropdowns are themed', (s) => {
      let src = ''
      s.Given('the RSVP meal choice dropdowns', () => {
        src = rsvp()
      })
      s.When('their markup is inspected', () => {})
      s.Then('the control has rounded borders, a chevron padded from the edge, and theme-colour hover and focus states', () => {
        expect(src, 'custom chevron replaces the stock arrow').toContain('appearance-none')
        expect(src, 'chevron padded from the edge').toContain('pr-10')
        expect(src, 'rounded control').toContain('rounded-2xl')
        expect(src, 'themed hover state').toContain('hover:border-petal')
        expect(src, 'themed focus state').toContain('focus:border-petal')
      })
    })
  })

  f.Rule('Favicon derives from the floral glyphs', (r) => {
    r.RuleScenario('Favicon is a hydrangea', (s) => {
      let svg = ''
      s.Given('the generated favicon.svg', () => {
        svg = readFileSync('public/favicon.svg', 'utf8')
      })
      s.When('its contents are read', () => {})
      s.Then('it renders a hydrangea mophead using theme palette colours', () => {
        // floret petal path (mophead shape language), not the old daisy petal
        expect(svg).toContain('-6.5,-11 0,-15.5')
        expect(svg).not.toContain('-15,-27 0,-38')
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
