import { finishAuthorisation } from '../../../utils/monzo'

// Monzo sends the admin back here; the payments page shows the outcome
export default defineEventHandler(async (event) => {
  const result = await finishAuthorisation(event, useRuntimeConfig(event))
  return sendRedirect(event, `/admin/payments?monzo=${result.ok ? 'authorised' : 'refused'}`)
})
