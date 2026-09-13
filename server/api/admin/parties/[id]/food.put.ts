import type { FoodSubmission } from '../../../../utils/food'
import { saveFood } from '../../../../utils/food'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<FoodSubmission>(event)
  const result = await saveFood(useDb(), id, body ?? { guests: [] }, { admin: true })
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
