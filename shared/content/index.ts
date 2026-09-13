import faqJson from './faq.json'
import giftsJson from './gifts.json'
import handoutJson from './handout.json'
import menuJson from './menu.json'
import roomsJson from './rooms.json'
import scheduleJson from './schedule.json'
import travelJson from './hotels.json'
import venueJson from './venue.json'

/** the booked venue — the one place its name, address, and links live */
export interface Venue {
  name: string
  /** postal address between the venue name and the county */
  addressLines: string[]
  county: string
  postcode: string
  url: string
  mapsUrl: string
}

export interface ScheduleEvent {
  name: string
  /** ISO local date-time, e.g. 2027-06-12T13:00 — venue-local, no timezone */
  start: string
  /** omitted when the event has no set finish */
  end?: string
  /** often a room within the venue — the venue itself lives in venue.json */
  location: string
  mapsUrl?: string
  description?: string
}

export interface Hotel {
  name: string
  description: string
  distance?: string
  url?: string
}

export interface TransportEntry {
  name: string
  description: string
  url?: string
}

export interface TravelInfo {
  hotels: Hotel[]
  transport: TransportEntry[]
  parking: string
}

export interface FaqEntry {
  question: string
  answer: string
}

export interface Gifts {
  message: string
}

export interface MenuOption {
  id: string
  name: string
  description?: string
}

export type CourseId = 'starter' | 'main' | 'dessert'

export interface MenuCourse {
  id: CourseId
  name: string
  options: MenuOption[]
  /** children get these when defined, the adult options otherwise */
  childOptions?: MenuOption[]
}

export interface Menu {
  /** only courses that will actually run — any of the three may be absent */
  courses: MenuCourse[]
}

/** which of the two wedding nights a room is booked for */
export type RoomNight = 'before' | 'of'

/** how a booked room is shared */
export type RoomChoice = 'our_room' | 'share_named' | 'share_match'

export interface Rooms {
  /**
   * The whole Monzo payment link, query string included — its own params are
   * what route a payment to the right account, so they must survive intact.
   */
  paymentUrl: string
  prices: {
    /** night before: per person whatever the choice */
    before: { perPerson: number }
    /** night of: flat per own room, per person for shares */
    of: { ourRoom: number, perPerson: number }
  }
}

/** on-the-day printed handout: ordered sections, each a title + line items */
export interface HandoutSection {
  title: string
  items: string[]
}

export interface Handout {
  sections: HandoutSection[]
}

export const venue: Venue = venueJson
export const schedule: ScheduleEvent[] = scheduleJson
export const travel: TravelInfo = travelJson
export const faq: FaqEntry[] = faqJson
export const gifts: Gifts = giftsJson
// json infers id: string; the union is narrowed here
export const menu: Menu = menuJson as Menu
export const handout: Handout = handoutJson
export const rooms: Rooms = roomsJson
