import { reconciliationStatus } from '../../../utils/reconcile'

export default defineEventHandler(async (event) => {
  const { secure } = await getUserSession(event)
  return {
    ...await reconciliationStatus(useDb(), useRuntimeConfig(event)),
    /** a callback has left a token for one check */
    authorised: Boolean(secure?.monzoToken),
  }
})
