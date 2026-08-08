import { listResponses } from '../../utils/save-the-date'

export default defineEventHandler(async () => ({
  responses: await listResponses(useDb()),
}))
