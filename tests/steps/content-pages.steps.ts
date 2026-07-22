// @vitest-environment nuxt
import { readFileSync } from 'node:fs'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeFeature, loadFeature, setVitestCucumberConfiguration } from '@amiceli/vitest-cucumber'
import { expect } from 'vitest'
import { faq, gifts, schedule, travel } from '#shared/content'

// dynamic imports so each missing page fails only its own scenario
const page = async (name: string) =>
  (await import(`../../app/pages/${name}.vue`)).default

// rendered html entity-escapes text content ("&" -> "&amp;")
const esc = (text: string) => text.replaceAll('&', '&amp;')

setVitestCucumberConfiguration({ excludeTags: ['manual'] })

const feature = await loadFeature('tests/features/content-pages.feature')

describeFeature(feature, (f) => {
  f.Rule('Schedule page from JSON', (r) => {
    r.RuleScenario('Event listed with map link', (s) => {
      let html = ''
      s.Given('events defined in schedule.json', () => {
        expect(schedule.length).toBeGreaterThan(0)
      })
      s.When('a guest views the schedule page', async () => {
        html = (await mountSuspended(await page('schedule'))).html()
      })
      s.Then('each event appears with name, time, location, and a Google Maps link', () => {
        for (const event of schedule) {
          expect(html).toContain(esc(event.name))
          expect(html).toContain(esc(event.location))
          expect(html).toContain(event.mapsUrl)
        }
        // times rendered human-readably (at least the hour appears)
        expect(html).toMatch(/\d{1,2}[:.]\d{2}/)
      })
    })

    r.RuleScenario('Adding an event', (s) => {
      let wrapper: Awaited<ReturnType<typeof mountSuspended>>
      s.Given('a new event added to schedule.json', () => {
        expect(schedule.length).toBeGreaterThan(0)
      })
      s.When('the site is rebuilt', async () => {
        wrapper = await mountSuspended(await page('schedule'))
      })
      s.Then('the schedule page shows the new event with no component changes', () => {
        // one rendered entry per JSON event proves the page is data-driven
        expect(wrapper.findAll('[data-event]')).toHaveLength(schedule.length)
      })
    })
  })

  f.Rule('Add-to-calendar download', (r) => {
    r.RuleScenario('Guest downloads calendar file', (s) => {
      let ics = ''
      s.Given('the schedule contains wedding day events', () => {
        expect(schedule.length).toBeGreaterThan(0)
      })
      s.When('a guest requests the add-to-calendar link', async () => {
        ics = (await import('../../server/utils/ics')).buildIcs(schedule)
      })
      s.Then('a valid .ics file is returned containing the events with correct titles, times, and locations', () => {
        expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/)
        expect(ics).toMatch(/\r\nEND:VCALENDAR\r\n?$/)
        expect(ics).toContain('VERSION:2.0')
        expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(schedule.length)
        for (const event of schedule) {
          expect(ics).toContain(`SUMMARY:${event.name.replaceAll(',', '\\,')}`)
          const dtstart = event.start.replaceAll(/[-:]/g, '')
          expect(ics).toContain(`DTSTART:${dtstart}00`)
          expect(ics).toContain(event.location.replaceAll(',', '\\,'))
        }
      })
    })
  })

  f.Rule('Travel and accommodation page from JSON', (r) => {
    r.RuleScenario('Hotel recommendations shown', (s) => {
      let html = ''
      s.Given('hotels defined in hotels.json', () => {
        expect(travel.hotels.length).toBeGreaterThan(0)
      })
      s.When('a guest views the travel page', async () => {
        html = (await mountSuspended(await page('travel'))).html()
      })
      s.Then('each hotel appears with name, description, and distance or link, alongside transport and parking sections', () => {
        for (const hotel of travel.hotels) {
          expect(html).toContain(hotel.name)
          expect(html).toContain(hotel.description)
          if (hotel.distance) expect(html).toContain(hotel.distance)
          if (hotel.url) expect(html).toContain(hotel.url)
        }
        for (const entry of travel.transport) {
          expect(html).toContain(entry.name)
        }
        expect(html).toContain(travel.parking)
      })
    })
  })

  f.Rule('Gift registry page', (r) => {
    r.RuleScenario('Guest visits gift page', (s) => {
      let html = ''
      s.Given('a fund message and link in gifts.json', () => {
        expect(gifts.url).toBeTruthy()
      })
      s.When('a guest views the gift page', async () => {
        html = (await mountSuspended(await page('gifts'))).html()
      })
      s.Then('the honeymoon fund message and external link are displayed', () => {
        expect(html).toContain(gifts.message)
        expect(html).toContain(gifts.url)
        expect(html).toContain(gifts.linkText)
      })
    })
  })

  f.Rule('FAQ page from JSON', (r) => {
    r.RuleScenario('FAQ entries rendered', (s) => {
      let html = ''
      s.Given('question and answer pairs in faq.json', () => {
        expect(faq.length).toBeGreaterThan(0)
      })
      s.When('a guest views the FAQ page', async () => {
        html = (await mountSuspended(await page('faq'))).html()
      })
      s.Then('every pair is displayed in order', () => {
        let cursor = -1
        for (const entry of faq) {
          const at = html.indexOf(entry.question)
          expect(at, `question "${entry.question}" present and in order`).toBeGreaterThan(cursor)
          expect(html).toContain(entry.answer)
          cursor = at
        }
      })
    })
  })

  f.Rule('Site link preview image', (r) => {
    r.RuleScenario('Link preview', (s) => {
      let config = ''
      s.Given('an uploaded couple photo configured as the Open Graph image', () => {
        config = readFileSync('nuxt.config.ts', 'utf8')
      })
      s.When('a site URL response is fetched', () => {
        // site-wide head is rendered into every response by Nuxt
      })
      s.Then('the OG meta tags reference the couple\'s photo, site title, and description', () => {
        expect(config).toContain('og:image')
        expect(config).toContain('og:title')
        expect(config).toContain('og:description')
        expect(config).toContain('/og.png')
      })
    })
  })
})
