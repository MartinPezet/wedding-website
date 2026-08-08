import { normalisePhone } from './phone'

/** what the save-the-date form collects, before validation */
export interface SaveTheDateInput {
  name?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postcode?: string
  country?: string
  stayNightBefore?: boolean
  stayNightOf?: boolean
}

/** a validated response, ready to store */
export interface SaveTheDateValue {
  name: string
  /** E.164 */
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  postcode: string
  country: string
  stayNightBefore: boolean
  stayNightOf: boolean
}

export type SaveTheDateResult =
  | { ok: true, value: SaveTheDateValue }
  | { ok: false, error: string }

export const DEFAULT_COUNTRY = 'United Kingdom'

const MAX = { name: 120, address: 120, city: 120, postcode: 20, country: 60 }

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/**
 * Validate and normalise one save-the-date submission. Called by the form before
 * posting and again by the public endpoint, which is the enforcement that counts.
 */
export function validateSaveTheDate(input: SaveTheDateInput): SaveTheDateResult {
  const name = text(input.name)
  const addressLine1 = text(input.addressLine1)
  const addressLine2 = text(input.addressLine2)
  const city = text(input.city)
  const postcode = text(input.postcode)
  const country = text(input.country) || DEFAULT_COUNTRY

  const required: [string, string, string][] = [
    [name, 'name', 'Please tell us your name.'],
    [addressLine1, 'addressLine1', 'Please enter the first line of your address.'],
    [city, 'city', 'Please enter your town or city.'],
    [postcode, 'postcode', 'Please enter your postcode.'],
    [country, 'country', 'Please enter your country.'],
  ]
  for (const [value, , message] of required) {
    if (!value) return { ok: false, error: message }
  }

  const tooLong = [
    [name, MAX.name],
    [addressLine1, MAX.address],
    [addressLine2, MAX.address],
    [city, MAX.city],
    [postcode, MAX.postcode],
    [country, MAX.country],
  ].some(([value, max]) => (value as string).length > (max as number))
  if (tooLong) return { ok: false, error: 'One of the answers is too long.' }

  const phone = normalisePhone(text(input.phone))
  if (!phone) return { ok: false, error: 'Please enter a valid phone number.' }

  return {
    ok: true,
    value: {
      name,
      phone,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      postcode,
      country,
      stayNightBefore: input.stayNightBefore === true,
      stayNightOf: input.stayNightOf === true,
    },
  }
}
