import { assignCredit } from '../../../utils/reconcile'

// an unmatched credit the admin attributed to a party; dismissing one never reaches the server
export default defineEventHandler(async (event) => {
  const result = await assignCredit(useDb(), await readBody(event))
  if (!result.ok) throw createError({ statusCode: 400, message: result.error })
  return result
})
