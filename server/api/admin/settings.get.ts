import { getAdminSettings } from '../../utils/admin'

export default defineEventHandler(() => getAdminSettings(useDb()))
