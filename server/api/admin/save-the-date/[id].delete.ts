import { deleteResponse } from '../../../utils/save-the-date'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  await deleteResponse(useDb(), id)
  return { ok: true }
})
