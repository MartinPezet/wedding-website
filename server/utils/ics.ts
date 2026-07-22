import type { ScheduleEvent } from '#shared/content'

// RFC 5545 text escaping: backslash, semicolon, comma, newline
const esc = (text: string) =>
  text.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n')

// '2027-06-12T13:00' -> '20270612T130000' (floating local time, venue-local)
const dt = (iso: string) => `${iso.replaceAll(/[-:]/g, '')}00`

export function buildIcs(events: ScheduleEvent[]): string {
  const stamp = dt(new Date().toISOString().slice(0, 16))
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ciera & Martin//Wedding//EN',
    'CALSCALE:GREGORIAN',
    ...events.flatMap((event, i) => [
      'BEGIN:VEVENT',
      `UID:event-${i}@wedding.ciera-and-martin`,
      `DTSTAMP:${stamp}Z`,
      `DTSTART:${dt(event.start)}`,
      `DTEND:${dt(event.end)}`,
      `SUMMARY:${esc(event.name)}`,
      `LOCATION:${esc(event.location)}`,
      ...(event.description ? [`DESCRIPTION:${esc(event.description)}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}
