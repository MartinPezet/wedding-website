import type { TableInput } from '../../../utils/seating'

export default defineEventHandler(async (event) => {
  const body = await readBody<TableInput>(event)
  return createTable(useDb(), {
    name: typeof body?.name === 'string' ? body.name : '',
    shape: body?.shape,
    capacity: Number(body?.capacity),
    x: body?.x === undefined ? undefined : Number(body.x),
    y: body?.y === undefined ? undefined : Number(body.y),
  })
})
