import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { faq, gifts, schedule, travel, venue } from '#shared/content'

describe('venue.json', () => {
  it('names the booked venue with address, county, website, and maps link', () => {
    expect(venue.name).toBe('St Audries Park')
    expect(venue.addressLines.length).toBeGreaterThan(0)
    for (const line of venue.addressLines) expect(line).toBeTruthy()
    expect(venue.county).toBe('Somerset')
    expect(venue.url).toMatch(/^https:\/\/(www\.)?audries-park\.co\.uk/)
    expect(venue.mapsUrl).toMatch(/^https:\/\//)
  })
})

describe('schedule.json', () => {
  it('has at least one event with name, start time, and location', () => {
    expect(schedule.length).toBeGreaterThan(0)
    for (const event of schedule) {
      expect(event.name).toBeTruthy()
      expect(event.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
      // a room within the venue is enough — the venue itself lives in venue.json
      expect(event.location).toBeTruthy()
      // end time and maps link are optional, but never present-and-empty: an
      // empty end once produced an invalid DTEND in the calendar download
      if ('end' in event) {
        expect(event.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
        expect(new Date(event.end!).getTime()).toBeGreaterThan(new Date(event.start).getTime())
      }
      if ('mapsUrl' in event) expect(event.mapsUrl).toMatch(/^https:\/\//)
    }
  })

  it('runs on the booked date', () => {
    // wedding day is 2027-01-16; the bar, breakfast and checkout roll into the 17th
    expect(schedule[0]!.start.startsWith('2027-01-16')).toBe(true)
    for (const event of schedule) {
      expect(event.start).toMatch(/^2027-01-1[67]T/)
    }
  })
})

describe('content files', () => {
  it('carry no placeholder venue references', () => {
    const dir = 'shared/content'
    for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
      expect(readFileSync(`${dir}/${file}`, 'utf8')).not.toMatch(/Huntsham|Devon/i)
    }
  })
})

describe('hotels.json', () => {
  it('has hotels with name, description, and distance or link', () => {
    expect(travel.hotels.length).toBeGreaterThan(0)
    for (const hotel of travel.hotels) {
      expect(hotel.name).toBeTruthy()
      expect(hotel.description).toBeTruthy()
      expect(hotel.distance || hotel.url).toBeTruthy()
    }
  })

  it('has transport entries and parking info', () => {
    expect(travel.transport.length).toBeGreaterThan(0)
    for (const entry of travel.transport) {
      expect(entry.name).toBeTruthy()
      expect(entry.description).toBeTruthy()
    }
    expect(travel.parking).toBeTruthy()
  })
})

describe('faq.json', () => {
  it('has question/answer pairs', () => {
    expect(faq.length).toBeGreaterThan(0)
    for (const entry of faq) {
      expect(entry.question).toBeTruthy()
      expect(entry.answer).toBeTruthy()
    }
  })
})

describe('gifts.json', () => {
  it('has a gift message and no fund link', () => {
    expect(gifts.message).toBeTruthy()
    expect(gifts).not.toHaveProperty('url')
    expect(gifts).not.toHaveProperty('linkText')
  })
})
