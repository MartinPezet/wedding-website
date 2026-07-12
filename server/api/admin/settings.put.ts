import type { AdminSettings } from '../../utils/admin'
import { saveSettings } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminSettings>(event)
  const input: AdminSettings = {}
  for (const field of ['weddingDate', 'rsvpDeadline'] as const) {
    const value = body?.[field]
    if (value === undefined) continue
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      throw createError({ statusCode: 400, message: `Invalid date for ${field}.` })
    }
    input[field] = value
  }
  await saveSettings(useDb(), input)
  return { ok: true }
})
