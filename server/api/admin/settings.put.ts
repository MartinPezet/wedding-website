import type { AdminDateSetting, AdminSettings } from '../../utils/admin'
import { DATE_SETTING_KEYS, saveSettings } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminSettings>(event)
  const input: AdminSettings = {}
  for (const field of Object.keys(DATE_SETTING_KEYS) as AdminDateSetting[]) {
    const value = body?.[field]
    if (value === undefined) continue
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      throw createError({ statusCode: 400, message: `Invalid date for ${field}.` })
    }
    input[field] = value
  }
  if (body?.foodChoiceOpen !== undefined) {
    if (typeof body.foodChoiceOpen !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Invalid value for foodChoiceOpen.' })
    }
    input.foodChoiceOpen = body.foodChoiceOpen
  }
  await saveSettings(useDb(), input)
  return { ok: true }
})
