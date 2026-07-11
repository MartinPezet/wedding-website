import { schedule } from '../../shared/content'
import { buildIcs } from '../utils/ics'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const index = query.event === undefined ? undefined : Number(query.event)
  const events = index === undefined ? schedule : [schedule[index]].filter(e => e !== undefined)
  if (events.length === 0) {
    throw createError({ statusCode: 404, message: 'No such event.' })
  }
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="ciera-and-martin.ics"')
  return buildIcs(events)
})
