import { computed, ref } from 'vue'
import type { SeatingData, SeatingGuest, SeatingPatch, SeatingTable, TableInput } from '../../server/utils/seating'
import type { TableShape } from '../../shared/utils/seating'
import { CANVAS } from '../../shared/utils/seating'

export type { SeatingGuest, SeatingTable }

/** fresh editor instance per call; the page owns the single live one */
export function useSeatingEditor(options: { autosaveDelay?: number } = {}) {
  const autosaveDelay = options.autosaveDelay ?? 800
  const tables = ref<SeatingTable[]>([])
  const guests = ref<SeatingGuest[]>([])
  const saveError = ref('')

  async function load() {
    // useRequestFetch forwards the admin session cookie during SSR ($fetch would 401)
    const data = await useRequestFetch()<SeatingData>('/api/admin/seating')
    tables.value = data.tables
    guests.value = data.guests
  }

  // --- debounced autosave: every mutation marks state dirty, flush PATCHes --
  const dirtyTables = new Set<number>()
  const dirtyGuests = new Set<number>()
  const deletedTables = new Set<number>()
  let timer: ReturnType<typeof setTimeout> | undefined

  function scheduleSave() {
    clearTimeout(timer)
    timer = setTimeout(() => { void flush() }, autosaveDelay)
  }

  async function flush() {
    clearTimeout(timer)
    if (!dirtyTables.size && !dirtyGuests.size && !deletedTables.size) return
    const body: SeatingPatch = {}
    const tablePatches = [...dirtyTables]
      .map(id => tables.value.find(table => table.id === id))
      .filter(table => table !== undefined)
      .map(table => ({ id: table.id, name: table.name, shape: table.shape, capacity: table.capacity, x: table.x, y: table.y }))
    if (tablePatches.length) body.tables = tablePatches
    const assignments = [...dirtyGuests]
      .map(id => guests.value.find(guest => guest.id === id))
      .filter(guest => guest !== undefined)
      .map(guest => ({ guestId: guest.id, tableId: guest.tableId, seatIndex: guest.seatIndex }))
    if (assignments.length) body.assignments = assignments
    if (deletedTables.size) body.deleteTables = [...deletedTables]
    dirtyTables.clear()
    dirtyGuests.clear()
    deletedTables.clear()
    try {
      await $fetch('/api/admin/seating', { method: 'PATCH', body })
      saveError.value = ''
    }
    catch {
      // ponytail: no retry queue — surface the failure, a reload re-syncs
      saveError.value = 'Autosave failed — check your connection and reload before editing further.'
    }
  }

  const guestAt = (tableId: number, seatIndex: number) =>
    guests.value.find(guest => guest.tableId === tableId && guest.seatIndex === seatIndex)

  const unassigned = computed(() =>
    guests.value.filter(guest => guest.attending && guest.tableId === null))

  const warnings = computed(() => {
    const orphans = guests.value.filter(guest => !guest.attending && guest.tableId !== null)
    const seatedCounts = new Map<number, number>()
    for (const guest of guests.value) {
      if (guest.tableId !== null) seatedCounts.set(guest.tableId, (seatedCounts.get(guest.tableId) ?? 0) + 1)
    }
    const overCapacity = tables.value.filter(table =>
      (seatedCounts.get(table.id) ?? 0) > table.capacity
      || guests.value.some(guest => guest.tableId === table.id && guest.seatIndex !== null && guest.seatIndex >= table.capacity))
    return { unseated: unassigned.value, orphans, overCapacity }
  })

  function assignGuest(guestId: number, tableId: number, seatIndex: number) {
    const guest = guests.value.find(g => g.id === guestId)
    if (!guest) return
    const occupant = guestAt(tableId, seatIndex)
    if (occupant && occupant.id !== guestId) return // seat taken: ignore the drop
    guest.tableId = tableId
    guest.seatIndex = seatIndex
    dirtyGuests.add(guestId)
    scheduleSave()
  }

  function unassignGuest(guestId: number) {
    const guest = guests.value.find(g => g.id === guestId)
    if (!guest) return
    guest.tableId = null
    guest.seatIndex = null
    dirtyGuests.add(guestId)
    scheduleSave()
  }

  async function addTable(shape: TableShape) {
    const input: TableInput = {
      name: `Table ${tables.value.length + 1}`,
      shape,
      capacity: shape === 'round' ? 8 : 6,
      x: CANVAS.width / 2,
      y: CANVAS.height / 2,
    }
    const row = await $fetch<SeatingTable>('/api/admin/seating/tables', { method: 'POST', body: input })
    tables.value.push(row)
    return row
  }

  function updateTable(tableId: number, patch: Partial<Pick<SeatingTable, 'name' | 'shape' | 'capacity'>>) {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return
    Object.assign(table, patch)
    // seats past a shrunk capacity no longer exist: unseat their guests
    for (const guest of guests.value) {
      if (guest.tableId === tableId && guest.seatIndex !== null && guest.seatIndex >= table.capacity) {
        guest.tableId = null
        guest.seatIndex = null
        dirtyGuests.add(guest.id)
      }
    }
    dirtyTables.add(tableId)
    scheduleSave()
  }

  function moveTable(tableId: number, x: number, y: number) {
    const table = tables.value.find(t => t.id === tableId)
    if (!table) return
    table.x = x
    table.y = y
    dirtyTables.add(tableId)
    scheduleSave()
  }

  function removeTable(tableId: number) {
    tables.value = tables.value.filter(t => t.id !== tableId)
    for (const guest of guests.value) {
      if (guest.tableId === tableId) {
        guest.tableId = null
        guest.seatIndex = null
      }
    }
    // server unassigns the table's guests as part of the delete
    dirtyTables.delete(tableId)
    deletedTables.add(tableId)
    scheduleSave()
  }

  return {
    tables,
    guests,
    saveError,
    load,
    flush,
    guestAt,
    unassigned,
    warnings,
    assignGuest,
    unassignGuest,
    addTable,
    updateTable,
    moveTable,
    removeTable,
  }
}
