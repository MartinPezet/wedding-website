import { getPartyList } from '../../utils/admin'

export default defineEventHandler(async () => ({ parties: await getPartyList(useDb()) }))
