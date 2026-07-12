import { regeneratePartyToken } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const party = await regeneratePartyToken(useDb(), id)
  return { token: party.token }
})
