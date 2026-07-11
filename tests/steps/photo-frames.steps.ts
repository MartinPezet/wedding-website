// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/photo-frames.feature')

describeFeature(feature, (f) => {
  f.Rule('Photos in floral frames', (r) => {
    r.RuleScenario('Framed photo renders', (s) => {
      let html = ''
      s.Given('a page containing a framed photo', () => {})
      s.When('the page renders', async () => {
        const FloralFrame = (await import('../../app/components/FloralFrame.vue')).default
        const wrapper = await mountSuspended(FloralFrame, {
          slots: { default: '<img src="/photos/couple.jpg" alt="The couple">' },
        })
        html = wrapper.html()
      })
      s.Then('the photo is clipped within a floral frame using theme colours', () => {
        expect(html).toContain('<img')
        // photo clipped by the frame mask
        expect(html).toMatch(/clip-path|mask/)
        // decorative SVG florals coloured via theme tokens
        expect(html).toContain('<svg')
        expect(html).toMatch(/var\(--color-(petal|leaf|gold)/)
      })
    })
  })

  // Rules "Frames animate on scroll" and "Responsive image delivery" contain
  // only @manual scenarios — excluded by the runner configuration above.
})
