import type { SaveTheDateInput } from '#shared/utils/save-the-date'
import { updateResponse } from '../../../utils/save-the-date'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<SaveTheDateInput>(event)
  const result = await updateResponse(useDb(), id, body ?? {})
  if (!result.ok) {
    throw createError({ statusCode: 400, message: result.error })
  }
  return { ok: true }
})
