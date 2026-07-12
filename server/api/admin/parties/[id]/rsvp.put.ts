import type { RsvpSubmission } from '../../../../utils/rsvp'
import { saveRsvp } from '../../../../utils/rsvp'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<RsvpSubmission>(event)
  const result = await saveRsvp(useDb(), id, body ?? { phone: '', guests: [] }, { admin: true })
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
