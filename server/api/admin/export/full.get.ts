import { buildFullWorkbook } from '../../../utils/export'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'content-disposition', 'attachment; filename="guest-list-full.xlsx"')
  return buildFullWorkbook(useDb())
})
