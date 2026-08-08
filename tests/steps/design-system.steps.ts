// @vitest-environment nuxt
import { readFileSync, readdirSync } from 'node:fs'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect, vi } from 'vitest'

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

// ---- staged reveal helpers -------------------------------------------------
// The directive keeps module state (one shared IntersectionObserver, plus the
// pending load batch), so every scenario resets the module before mounting.

interface FakeEl {
  attrs: Record<string, string>
  /** every state written, in order — a reveal must pass through "hidden" first */
  states: string[]
  /** transition-delay set by the cascade, in ms */
  delay: () => number
  setAttribute: (key: string, value: string) => void
  removeAttribute?: (key: string) => void
  getBoundingClientRect?: () => { top: number, bottom: number }
  style: { setProperty: (name: string, value: string) => void }
}

const fakeEl = (rect?: { top: number, bottom: number }): FakeEl => {
  const attrs: Record<string, string> = {}
  const states: string[] = []
  const custom: Record<string, string> = {}
  return {
    attrs,
    states,
    delay: () => Number.parseInt(custom['--reveal-delay'] ?? '0', 10),
    setAttribute: (key, value) => {
      attrs[key] = value
      if (key === 'data-reveal') states.push(value)
    },
    removeAttribute: (key) => { Reflect.deleteProperty(attrs, key) },
    ...(rect ? { getBoundingClientRect: () => rect } : {}),
    style: { setProperty: (name, value) => { custom[name] = value } },
  }
}

// the directive reveals on the next frames so the transition has a from-state;
// run them synchronously here
const runFrames = () => {
  // @ts-expect-error happy-dom does not schedule frames in this environment
  globalThis.requestAnimationFrame = (callback: () => void) => { callback(); return 0 }
}

/** frames that must be flushed by hand, to prove a reveal waits for a paint */
let frameQueue: (() => void)[] = []
const deferFrames = () => {
  frameQueue = []
  // @ts-expect-error happy-dom does not schedule frames in this environment
  globalThis.requestAnimationFrame = (callback: () => void) => { frameQueue.push(callback); return 0 }
}
const flushFrames = () => {
  // two nested frames, so drain until nothing new is queued
  for (let pass = 0; pass < 5 && frameQueue.length; pass += 1) {
    const queued = frameQueue
    frameQueue = []
    for (const callback of queued) callback()
  }
}

let observed: { callback: (entries: { isIntersecting: boolean, target: unknown }[]) => void, unobserved: unknown[] }

const withObserver = () => {
  observed = { callback: () => {}, unobserved: [] }
  // @ts-expect-error minimal stand-in for the browser API
  globalThis.IntersectionObserver = class {
    constructor(callback: never) { observed.callback = callback as never }
    observe() {}
    unobserve(target: unknown) { observed.unobserved.push(target) }
    disconnect() {}
  }
}

const withReducedMotion = (reduced: boolean) => {
  // @ts-expect-error happy-dom does not implement media query matching
  globalThis.matchMedia = (query: string) => ({ matches: reduced && query.includes('reduce') })
}

let directive: { mounted: (el: never, binding: never) => void }

/** fresh module instance, so the shared observer picks up this scenario's stub */
const freshDirective = async () => {
  vi.resetModules()
  directive = (await import(`../../app/utils/${'reveal'}`)).revealDirective
}

const mountDirective = async (target: FakeEl, modifiers: Record<string, boolean> = {}) => {
  if (!directive) await freshDirective()
  directive.mounted(target as never, { modifiers } as never)
}

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
  f.Rule('Staged page reveal on the guest frontend', (r) => {
    // guest-facing pages only — admin and print are excluded by the last Rule
    const guestPages = ['index', 'welcome', 'save-the-date', 'schedule', 'travel', 'gifts', 'faq', 'rsvp']
    const pageSource = (name: string) => readFileSync(`app/pages/${name}.vue`, 'utf8')

    r.RuleScenario('Focal element arrives first', (s) => {
      const focal = fakeEl()
      const later = fakeEl()
      s.Given('a guest page with a focal element and later revealing sections', () => {
        for (const name of guestPages) {
          expect(pageSource(name), `${name}.vue has a focal element`).toMatch(/v-reveal\.focal/)
        }
      })
      s.When('the page loads', async () => {
        withReducedMotion(false)
        withObserver()
        runFrames()
        await freshDirective()
        await mountDirective(focal, { focal: true })
        await mountDirective(later)
      })
      s.Then('the focal element is revealed and the later sections are not yet revealed', () => {
        expect(focal.attrs['data-reveal']).toBe('in')
        // it must pass through the hidden state, or the fade has nothing to animate from
        expect(focal.states).toEqual(['hidden', 'in'])
        expect(later.attrs['data-reveal']).toBe('hidden')
      })
    })

    r.RuleScenario('Section reveals when reached', (s) => {
      const section = fakeEl()
      s.Given('a revealing section below the fold', async () => {
        withReducedMotion(false)
        withObserver()
        await freshDirective()
        await mountDirective(section)
        expect(section.attrs['data-reveal']).toBe('hidden')
      })
      s.When('it is scrolled into view', () => {
        observed.callback([{ isIntersecting: true, target: section }])
      })
      s.Then('it is revealed and stays revealed after scrolling away and back', () => {
        expect(section.attrs['data-reveal']).toBe('in')
        // observation is one-shot, so leaving the viewport can never hide it again
        expect(observed.unobserved).toContain(section)
        observed.callback([{ isIntersecting: false, target: section }])
        expect(section.attrs['data-reveal']).toBe('in')
      })
    })

    r.RuleScenario('A group reveals as a cascade', (s) => {
      // all below the fold, so they wait on the observer rather than revealing on
      // load; deliberately out of document order, to prove the batch is sorted
      const middle = fakeEl({ top: 1200, bottom: 1400 })
      const top = fakeEl({ top: 1000, bottom: 1150 })
      const bottom = fakeEl({ top: 1600, bottom: 1800 })
      s.Given('several revealing sections that arrive together', async () => {
        withReducedMotion(false)
        withObserver()
        runFrames()
        globalThis.innerHeight = 800
        await freshDirective()
        for (const section of [middle, top, bottom]) {
          await mountDirective(section)
          expect(section.attrs['data-reveal']).toBe('hidden')
        }
      })
      s.When('they cross into view in the same batch', () => {
        observed.callback([middle, top, bottom].map(target => ({ isIntersecting: true, target })))
      })
      s.Then('each is revealed a step later than the one above it', () => {
        for (const section of [top, middle, bottom]) {
          expect(section.attrs['data-reveal']).toBe('in')
        }
        // sorted by position, not by the order they were handed over
        expect([top.delay(), middle.delay(), bottom.delay()]).toEqual([0, 400, 800])
      })
    })

    r.RuleScenario('A long cascade stops growing', (s) => {
      const many = Array.from({ length: 8 }, (_, index) =>
        fakeEl({ top: 1000 + index * 100, bottom: 1050 + index * 100 }))
      s.Given('more sections arriving together than the cascade cap allows', async () => {
        withReducedMotion(false)
        withObserver()
        runFrames()
        globalThis.innerHeight = 800
        await freshDirective()
        for (const section of many) await mountDirective(section)
      })
      s.When('they cross into view in the same batch', () => {
        observed.callback(many.map(target => ({ isIntersecting: true, target })))
      })
      s.Then('the delay stops increasing at the cap so the tail does not drag', () => {
        expect(many.map(section => section.delay()))
          .toEqual([0, 400, 800, 1200, 1600, 1600, 1600, 1600])
      })
    })

    r.RuleScenario('A section added after navigation still animates', (s) => {
      const section = fakeEl({ top: 1200, bottom: 1400 })
      s.Given('a revealing section created by a client-side navigation', async () => {
        withReducedMotion(false)
        withObserver()
        deferFrames()
        globalThis.innerHeight = 800
        await freshDirective()
        await mountDirective(section)
      })
      s.When('it crosses into view in the same frame it was created', () => {
        observed.callback([{ isIntersecting: true, target: section }])
      })
      s.Then('its hidden state is painted before it reveals, so the transition runs', () => {
        // revealing in the creating frame would leave nothing to animate from
        expect(section.attrs['data-reveal']).toBe('hidden')
        flushFrames()
        expect(section.attrs['data-reveal']).toBe('in')
        expect(section.states).toEqual(['hidden', 'in'])
      })
    })

    r.RuleScenario('Untagged content is always visible', (s) => {
      let text = ''
      s.Given('a guest page containing elements that have not opted into the reveal', () => {
        text = css()
      })
      s.When('the page renders', () => {})
      s.Then('those elements are visible with no reveal behaviour', () => {
        // every reveal rule is scoped to the attribute the directive sets, so
        // nothing without that attribute can be hidden
        const revealRules = text.split('}').filter(rule => /data-reveal/.test(rule))
        expect(revealRules.length).toBeGreaterThan(0)
        for (const rule of revealRules) {
          expect(rule, 'reveal rule is attribute-scoped').toMatch(/\[data-reveal/)
        }
      })
    })
  })

  f.Rule('Reveal never withholds content', (r) => {
    r.RuleScenario('No JavaScript', (s) => {
      let styles = ''
      s.Given('a page rendered without its client JavaScript running', () => {
        styles = css()
      })
      s.When('its markup is inspected', () => {})
      s.Then('every section is visible and no element carries a hidden state', () => {
        // the server ships data-reveal="hidden" so nothing is painted visible and
        // then hidden, but it only bites under .reveal-armed — a class added by an
        // inline script, which never runs without JavaScript
        const hidingRules = styles.split('}').filter(rule => /opacity:\s*0\b/.test(rule))
        expect(hidingRules.length).toBeGreaterThan(0)
        for (const rule of hidingRules) {
          expect(rule, 'every hiding rule is gated on the runtime class')
            .toMatch(/\.reveal-armed\s+\[data-reveal="hidden"\]/)
        }
        expect(styles, 'the stylesheet never hides an untagged element')
          .not.toMatch(/^\s*(section|div|main|article)\s*\{[^}]*opacity:\s*0/m)
      })
    })

    r.RuleScenario('Hydration never runs', (s) => {
      let headScript = ''
      s.Given('a page whose client JavaScript loads but never hydrates', () => {
        headScript = readFileSync('nuxt.config.ts', 'utf8')
      })
      s.When('the reveal watchdog fires', () => {})
      s.Then('the hidden state is lifted and every section becomes visible', () => {
        expect(headScript).toContain('classList.add("reveal-armed")')
        // the watchdog only lifts the gate when no element ever mounted
        expect(headScript).toMatch(/if\(!window\.__revealMounted\)/)
        expect(headScript).toContain('classList.remove("reveal-armed")')
        expect(readFileSync('app/utils/reveal.ts', 'utf8')).toContain('__revealMounted')
      })
    })

    r.RuleScenario('Reduced motion', (s) => {
      const target = fakeEl()
      s.Given('a visitor with prefers-reduced-motion enabled', () => {
        // @ts-expect-error happy-dom does not implement media query matching
        globalThis.matchMedia = (query: string) => ({ matches: query.includes('reduce') })
      })
      s.When('a page renders', async () => {
        await freshDirective()
        await mountDirective(target)
      })
      s.Then('every section is visible immediately with no reveal animation', () => {
        expect(target.attrs['data-reveal']).toBeUndefined()
      })
    })

    r.RuleScenario('Already on screen at mount', (s) => {
      // an element in view must not wait on the observer, which never fires in a
      // frame that is not compositing (background tab, hidden embed)
      const onScreen = fakeEl({ top: 100, bottom: 300 })
      s.Given('a revealing element inside the viewport', () => {
        // @ts-expect-error happy-dom does not implement media query matching
        globalThis.matchMedia = () => ({ matches: false })
        // @ts-expect-error minimal stand-in for the browser API that never calls back
        globalThis.IntersectionObserver = class {
          observe() {}
          unobserve() {}
          disconnect() {}
        }
        globalThis.innerHeight = 800
      })
      s.When('the page loads', async () => {
        runFrames()
        await freshDirective()
        await mountDirective(onScreen)
      })
      s.Then('it is revealed without waiting for an intersection callback', () => {
        expect(onScreen.states).toEqual(['hidden', 'in'])
      })
    })

    r.RuleScenario('Observer unavailable', (s) => {
      const target = fakeEl()
      s.Given('a browser without IntersectionObserver support', () => {
        // @ts-expect-error happy-dom does not implement media query matching
        globalThis.matchMedia = () => ({ matches: false })
        // @ts-expect-error deliberately removing the API under test
        globalThis.IntersectionObserver = undefined
      })
      s.When('a page loads', async () => {
        runFrames()
        await freshDirective()
        await mountDirective(target)
      })
      s.Then('every revealing element is revealed immediately', () => {
        expect(target.states).toEqual(['hidden', 'in'])
      })
    })
  })

  f.Rule('Reveal is scoped to the guest frontend', (r) => {
    const vueFilesIn = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory()
          ? vueFilesIn(`${dir}/${entry.name}`)
          : entry.name.endsWith('.vue') ? [`${dir}/${entry.name}`] : [])

    r.RuleScenario('Print routes unaffected', (s) => {
      let files: string[] = []
      s.Given('the print routes', () => {
        files = [...vueFilesIn('app/pages/admin/print'), 'app/components/PrintPage.vue']
      })
      s.When('their markup is inspected', () => {})
      s.Then('no element carries reveal behaviour and every element is fully visible', () => {
        expect(files.length).toBeGreaterThan(0)
        for (const file of files) {
          expect(readFileSync(file, 'utf8'), `${file} has no reveal`).not.toMatch(/v-reveal/)
        }
      })
    })

    r.RuleScenario('Admin pages unaffected', (s) => {
      let files: string[] = []
      s.Given('the admin pages', () => {
        files = [...vueFilesIn('app/pages/admin'), 'app/layouts/admin.vue']
      })
      s.When('their markup is inspected', () => {})
      s.Then('no element carries reveal behaviour', () => {
        for (const file of files) {
          expect(readFileSync(file, 'utf8'), `${file} has no reveal`).not.toMatch(/v-reveal/)
        }
      })
    })
  })
})
