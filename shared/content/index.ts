import faqJson from './faq.json'
import giftsJson from './gifts.json'
import menuJson from './menu.json'
import scheduleJson from './schedule.json'
import travelJson from './hotels.json'

export interface ScheduleEvent {
  name: string
  /** ISO local date-time, e.g. 2027-06-12T13:00 — venue-local, no timezone */
  start: string
  end: string
  location: string
  mapsUrl: string
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
  url: string
  linkText: string
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

export const schedule: ScheduleEvent[] = scheduleJson
export const travel: TravelInfo = travelJson
export const faq: FaqEntry[] = faqJson
export const gifts: Gifts = giftsJson
// json infers id: string; the union is narrowed here
export const menu: Menu = menuJson as Menu
