// { pair: [firstId, secondId] } pairs two match-me requests; { unpair: id } clears one pairing
export default defineEventHandler(async (event) => {
  const body = await readBody<{ pair?: unknown, unpair?: unknown }>(event)
  const db = useDb()

  if (body?.unpair !== undefined) {
    const id = Number(body.unpair)
    if (!Number.isInteger(id)) throw createError({ statusCode: 400, message: 'Unknown room request.' })
    await unpairRooms(db, id)
    return { ok: true }
  }

  const [first, second] = Array.isArray(body?.pair) ? body.pair.map(Number) : []
  if (!Number.isInteger(first) || !Number.isInteger(second)) {
    throw createError({ statusCode: 400, message: 'Choose two requests to pair.' })
  }
  const result = await pairRooms(db, first!, second!)
  if (!result.ok) throw createError({ statusCode: 400, message: result.error })
  return result
})
