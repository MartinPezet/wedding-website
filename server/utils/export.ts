import ExcelJS from 'exceljs'
import { menu } from '../../shared/content'
import { COURSE_FIELDS } from '../../shared/utils/menu'
import type { Db } from './db'
import { getPartyList } from './admin'

type GuestRow = Awaited<ReturnType<typeof getPartyList>>[number]['guests'][number]

const allMealOptions = menu.courses.flatMap(course => [...course.options, ...(course.childOptions ?? [])])
const optionName = (id: string | null) => allMealOptions.find(option => option.id === id)?.name ?? ''

const courseCell = (guest: GuestRow, courseId: keyof typeof COURSE_FIELDS) =>
  optionName(guest[COURSE_FIELDS[courseId]])

const styleHeader = (sheet: ExcelJS.Worksheet) => {
  sheet.getRow(1).font = { bold: true }
}

/** count of attending guests per option, for one course */
const courseCounts = (guests: GuestRow[], courseId: keyof typeof COURSE_FIELDS) => {
  const counts = new Map<string, number>()
  for (const guest of guests) {
    const choice = guest[COURSE_FIELDS[courseId]]
    if (guest.attending && choice) {
      counts.set(choice, (counts.get(choice) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Venue pack: attendees (one column per defined course) + course-grouped meal
 * totals, attending guests only.
 * MUST NOT contain phone numbers anywhere — venue-bound file.
 */
export async function buildVenueWorkbook(db: Db): Promise<Uint8Array> {
  const parties = await getPartyList(db)
  const workbook = new ExcelJS.Workbook()

  const attendees = workbook.addWorksheet('Attendees')
  attendees.columns = [
    { header: 'Guest', key: 'guest', width: 28 },
    { header: 'Party', key: 'party', width: 28 },
    ...menu.courses.map(course => ({ header: course.name, key: course.id, width: 26 })),
    { header: 'Dietary requirements', key: 'dietary', width: 40 },
  ]
  for (const party of parties) {
    for (const guest of party.guests) {
      if (guest.attending !== true) continue
      attendees.addRow({
        guest: guest.name,
        party: party.name,
        ...Object.fromEntries(menu.courses.map(course => [course.id, courseCell(guest, course.id)])),
        dietary: guest.dietaryNotes ?? '',
      })
    }
  }
  styleHeader(attendees)

  const totals = workbook.addWorksheet('Meal Totals')
  totals.columns = [
    { header: 'Course', key: 'course', width: 14 },
    { header: 'Meal', key: 'meal', width: 26 },
    { header: 'Count', key: 'count', width: 10 },
  ]
  const allGuests = parties.flatMap(party => party.guests)
  for (const course of menu.courses) {
    const counts = courseCounts(allGuests, course.id)
    for (const option of [...course.options, ...(course.childOptions ?? [])]) {
      totals.addRow({ course: course.name, meal: option.name, count: counts.get(option.id) ?? 0 })
    }
  }
  styleHeader(totals)

  return new Uint8Array(await workbook.xlsx.writeBuffer())
}

/** Full guest list for the couple: every guest with contact and response details. */
export async function buildFullWorkbook(db: Db): Promise<Uint8Array> {
  const parties = await getPartyList(db)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Guests')
  sheet.columns = [
    { header: 'Party', key: 'party', width: 28 },
    { header: 'Guest', key: 'guest', width: 28 },
    { header: 'Child', key: 'child', width: 8 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Responded', key: 'responded', width: 22 },
    { header: 'Attending', key: 'attending', width: 12 },
    ...menu.courses.map(course => ({ header: course.name, key: course.id, width: 26 })),
    { header: 'Dietary notes', key: 'dietary', width: 32 },
    { header: 'Song request', key: 'song', width: 28 },
    { header: 'Note to couple', key: 'note', width: 40 },
  ]
  for (const party of parties) {
    for (const guest of party.guests) {
      sheet.addRow({
        party: party.name,
        guest: guest.name,
        child: guest.isChild ? 'Yes' : '',
        phone: guest.phone ?? '',
        responded: party.respondedAt ?? '',
        attending: guest.attending === null ? '' : guest.attending ? 'Yes' : 'No',
        ...Object.fromEntries(menu.courses.map(course => [course.id, courseCell(guest, course.id)])),
        dietary: guest.dietaryNotes ?? '',
        song: party.songRequest ?? '',
        note: party.noteToCouple ?? '',
      })
    }
  }
  styleHeader(sheet)
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}
