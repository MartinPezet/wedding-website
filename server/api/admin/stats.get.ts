import { getDashboardStats } from '../../utils/admin'

export default defineEventHandler(() => getDashboardStats(useDb()))
