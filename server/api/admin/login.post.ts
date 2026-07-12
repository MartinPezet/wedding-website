import { createLoginLimiter, safeEqual } from '../../utils/auth'

const limiter = createLoginLimiter()

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  limiter.assertAllowed(ip)

  const body = await readBody<{ password?: string }>(event)
  const expected = useRuntimeConfig(event).adminPassword
  const ok = Boolean(expected) && safeEqual(body?.password ?? '', expected)

  if (!ok) {
    limiter.recordFailure(ip)
    throw createError({ statusCode: 401, message: 'That password isn\'t right — try again.' })
  }

  limiter.reset(ip)
  await setUserSession(event, { user: { guest: true }, admin: true })
  return { ok: true }
})
