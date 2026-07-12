import { createHash, timingSafeEqual } from 'node:crypto'

export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

// ponytail: per-instance limiter, move to DB-backed if abuse observed
export function createLoginLimiter() {
  const attempts = new Map<string, { fails: number, lockedUntil: number }>()
  return {
    assertAllowed(ip: string) {
      const entry = attempts.get(ip)
      if (entry && entry.lockedUntil > Date.now()) {
        throw createError({ statusCode: 429, message: 'Too many attempts — please try again later.' })
      }
    },
    recordFailure(ip: string) {
      const now = Date.now()
      const fails = (attempts.get(ip)?.fails ?? 0) + 1
      // 5 free attempts, then exponential backoff: 30s, 60s, 120s, ...
      const lockedUntil = fails >= 5 ? now + 2 ** (fails - 5) * 30_000 : 0
      attempts.set(ip, { fails, lockedUntil })
      if (attempts.size > 500) {
        for (const [key, value] of attempts) {
          if (value.lockedUntil < now) attempts.delete(key)
        }
      }
    },
    reset(ip: string) {
      attempts.delete(ip)
    },
  }
}
