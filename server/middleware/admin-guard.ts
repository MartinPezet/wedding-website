import { safeEqual } from '../utils/auth'

// Server-side enforcement for all admin APIs — UI middleware is not enforcement.
export default defineEventHandler(async (event) => {
  const path = event.path ?? ''
  if (!path.startsWith('/api/admin/') || path.startsWith('/api/admin/login')) return

  const session = await getUserSession(event)
  if (session?.admin) return

  // nightly backup cron authenticates with a bearer secret, no browser session
  if (path.startsWith('/api/admin/backup')) {
    const secret = useRuntimeConfig(event).backupSecret
    const header = getHeader(event, 'authorization') ?? ''
    if (secret && header.startsWith('Bearer ') && safeEqual(header.slice(7), secret)) return
  }

  throw createError({ statusCode: 401, message: 'Admin sign-in required.' })
})
