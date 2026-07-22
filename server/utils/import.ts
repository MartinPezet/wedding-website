import Papa from 'papaparse'
import { normalisePhone } from '#shared/utils/phone'
import { createParty } from './parties'
import type { Db } from './db'
import { getPartyList } from './admin'

export interface ImportRow {
  /** 1-based data row number (header excluded) */
  line: number
  party: string
  guest: string
  phone: string
  isChild: boolean
  errors: string[]
}

const TRUTHY = new Set(['yes', 'y', 'true', '1'])

/** Parse the guest-list CSV (columns: party, guest, phone?, child?) into validated rows. */
export function parseGuestCsv(csv: string, existingPartyNames: string[]): ImportRow[] {
  const existing = new Set(existingPartyNames.map(name => name.toLowerCase()))
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().toLowerCase(),
  })

  const rows: ImportRow[] = parsed.data.map((record, index) => {
    const party = (record.party ?? '').trim()
    const guest = (record.guest ?? '').trim()
    const phone = (record.phone ?? '').trim()
    const child = (record.child ?? '').trim().toLowerCase()
    const errors: string[] = []
    if (!party) errors.push('Missing party name.')
    if (!guest) errors.push('Missing guest name.')
    if (phone && !normalisePhone(phone)) errors.push('Invalid phone number.')
    // add-only import: existing parties are corrected via CRUD, not merged
    if (party && existing.has(party.toLowerCase())) errors.push('Party already exists.')
    return { line: index + 1, party, guest, phone, isChild: TRUTHY.has(child), errors }
  })

  // duplicate guest names within the same party in the file
  const seen = new Map<string, ImportRow>()
  for (const row of rows) {
    const key = `${row.party.toLowerCase()}|${row.guest.toLowerCase()}`
    if (row.party && row.guest && seen.has(key)) {
      row.errors.push('Duplicate guest name in this party.')
    }
    seen.set(key, row)
  }
  return rows
}

export type ImportResult = { ok: true, created: number } | { ok: false, rows: ImportRow[] }

/** Commit the CSV: creates every party with its guests and fresh tokens. All-or-nothing. */
export async function importGuestCsv(db: Db, csv: string): Promise<ImportResult> {
  const existingNames = (await getPartyList(db)).map(party => party.name)
  const rows = parseGuestCsv(csv, existingNames)
  if (rows.length === 0 || rows.some(row => row.errors.length > 0)) {
    return { ok: false, rows }
  }

  const byParty = new Map<string, ImportRow[]>()
  for (const row of rows) {
    const group = byParty.get(row.party) ?? []
    group.push(row)
    byParty.set(row.party, group)
  }
  for (const [name, group] of byParty) {
    await createParty(db, {
      name,
      guests: group.map(row => ({ name: row.guest, isChild: row.isChild, phone: row.phone || undefined })),
    })
  }
  return { ok: true, created: byParty.size }
}
