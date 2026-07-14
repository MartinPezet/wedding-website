import type { SeatingPatch } from '../../utils/seating'

// batched autosave: table moves/edits + seat assignments in one call
export default defineEventHandler(async (event) => {
  const body = await readBody<SeatingPatch>(event)
  if (!body || (!Array.isArray(body.tables) && !Array.isArray(body.assignments) && !Array.isArray(body.deleteTables))) {
    throw createError({ statusCode: 400, message: 'Nothing to save.' })
  }
  return applySeatingPatch(useDb(), body)
})
