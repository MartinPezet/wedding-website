import { getPartyList } from '../../utils/admin'
import { importGuestCsv, parseGuestCsv } from '../../utils/import'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ csv?: string, commit?: boolean }>(event)
  if (typeof body?.csv !== 'string' || !body.csv.trim()) {
    throw createError({ statusCode: 400, message: 'No CSV content provided.' })
  }
  const db = useDb()
  if (body.commit) {
    const result = await importGuestCsv(db, body.csv)
    if (!result.ok) {
      throw createError({ statusCode: 400, message: 'The CSV still has invalid rows — fix them and preview again.' })
    }
    return result
  }
  const existing = (await getPartyList(db)).map(party => party.name)
  return { rows: parseGuestCsv(body.csv, existing) }
})
