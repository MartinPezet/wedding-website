import type { RsvpSubmission } from '../utils/rsvp'
import { saveRsvp } from '../utils/rsvp'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Please sign in first.' })
  }
  if (!session.partyId) {
    throw createError({ statusCode: 403, message: 'No invitation found — open the link from your invite first.' })
  }

  const body = await readBody<RsvpSubmission>(event)
  const result = await saveRsvp(useDb(), session.partyId, body ?? { phone: '', guests: [] })
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
