import { createHash, timingSafeEqual } from 'node:crypto'

// ponytail: per-instance limiter, move to DB-backed if abuse observed
const attempts = new Map<string, { fails: number, lockedUntil: number }>()

function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()

  const entry = attempts.get(ip)
  if (entry && entry.lockedUntil > now) {
    throw createError({ statusCode: 429, message: 'Too many attempts — please try again later.' })
  }

  const body = await readBody<{ password?: string }>(event)
  const expected = useRuntimeConfig(event).sitePassword
  const ok = Boolean(expected) && safeEqual(body?.password ?? '', expected)

  if (!ok) {
    const fails = (entry?.fails ?? 0) + 1
    // 5 free attempts, then exponential backoff: 30s, 60s, 120s, ...
    const lockedUntil = fails >= 5 ? now + 2 ** (fails - 5) * 30_000 : 0
    attempts.set(ip, { fails, lockedUntil })
    if (attempts.size > 500) {
      for (const [key, value] of attempts) {
        if (value.lockedUntil < now) attempts.delete(key)
      }
    }
    throw createError({ statusCode: 401, message: 'That password isn\'t right — try again.' })
  }

  attempts.delete(ip)
  await setUserSession(event, { user: { guest: true } })
  return { ok: true }
})
