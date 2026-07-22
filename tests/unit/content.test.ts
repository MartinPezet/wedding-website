import { describe, expect, it } from 'vitest'
import { faq, gifts, schedule, travel } from '#shared/content'

describe('schedule.json', () => {
  it('has at least one event with name, times, location, and maps link', () => {
    expect(schedule.length).toBeGreaterThan(0)
    for (const event of schedule) {
      expect(event.name).toBeTruthy()
      expect(event.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
      expect(event.end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
      expect(new Date(event.end).getTime()).toBeGreaterThan(new Date(event.start).getTime())
      expect(event.location).toBeTruthy()
      expect(event.mapsUrl).toMatch(/^https:\/\//)
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
  it('has a honeymoon fund message and external link', () => {
    expect(gifts.message).toBeTruthy()
    expect(gifts.url).toMatch(/^https:\/\//)
    expect(gifts.linkText).toBeTruthy()
  })
})
