import { eq } from 'drizzle-orm'
import { parties } from '../db/schema'

// QR invite links: any URL carrying ?t=<party token> unlocks the site and
// identifies the party; unknown tokens fall back to the password gate.
export default defineEventHandler(async (event) => {
  const token = getQuery(event).t
  if (typeof token !== 'string' || !token) return

  const party = await useDb().query.parties.findFirst({ where: eq(parties.token, token) })
  if (party) {
    await setUserSession(event, { user: { guest: true }, partyId: party.id })
    return
  }

  const session = await getUserSession(event)
  if (session?.user) return
  const path = event.path ?? ''
  if (path.startsWith('/api/') || path.startsWith('/_') || path.startsWith('/welcome')) return
  return sendRedirect(event, '/welcome?invite=link')
})
