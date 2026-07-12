import { buildVenueWorkbook } from '../../../utils/export'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'content-disposition', 'attachment; filename="venue-pack.xlsx"')
  return buildVenueWorkbook(useDb())
})
