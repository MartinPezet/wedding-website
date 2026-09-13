import { beginAuthorisation, monzoConfigured } from '../../../utils/monzo'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  // the payments page explains why reconciliation is unavailable
  if (!monzoConfigured(config)) return sendRedirect(event, '/admin/payments')
  return sendRedirect(event, await beginAuthorisation(event, config))
})
