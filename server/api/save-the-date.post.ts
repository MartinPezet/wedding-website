import type { SaveTheDateInput } from '#shared/utils/save-the-date'
import { createLoginLimiter } from '../utils/auth'
import { saveResponse } from '../utils/save-the-date'

// public, unauthenticated route: no session, no party token. Every field is
// revalidated here — the form's own checks are convenience, this is enforcement.
// ponytail: reuses the gate's attempt limiter, counting every submission
const limiter = createLoginLimiter()

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  limiter.assertAllowed(ip)
  limiter.recordFailure(ip)

  const body = await readBody<SaveTheDateInput>(event)
  const result = await saveResponse(useDb(), body ?? {})
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
