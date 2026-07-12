import { dumpDatabase } from '../../utils/backup'

// Auth (admin session or bearer secret) enforced by server/middleware/admin-guard.ts
export default defineEventHandler(() => dumpDatabase(useDb()))
