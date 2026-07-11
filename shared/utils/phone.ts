import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Validate a contact number in common national/international formats and
 * normalise to E.164. GB default region for numbers without a country code.
 * Returns null when invalid.
 */
export function normalisePhone(input: string): string | null {
  const parsed = parsePhoneNumberFromString(input, 'GB')
  return parsed?.isValid() ? parsed.number : null
}
