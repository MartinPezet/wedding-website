import type { FoodSubmission } from '../utils/food'
import { saveFood } from '../utils/food'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Please sign in first.' })
  }
  if (!session.partyId) {
    throw createError({ statusCode: 403, message: 'No invitation found — open the link from your invite first.' })
  }

  const body = await readBody<FoodSubmission>(event)
  const result = await saveFood(useDb(), session.partyId, body ?? { guests: [] })
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
