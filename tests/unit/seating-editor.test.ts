// @vitest-environment nuxt
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { menu } from '../../shared/content'

// variable paths so missing modules fail tests, not collection
const composable = async () => await import(`../../app/composables/${'useSeatingEditor'}.ts`)
const pageModule = async () => (await import(`../../app/pages/admin/${'seating'}.vue`)).default

const mainOption = menu.courses.find(course => course.id === 'main')!.options[0]!

const fixture = () => ({
  tables: [
    { id: 1, name: 'Top Table', shape: 'round' as const, x: 200, y: 150, capacity: 8, sortOrder: 0 },
    { id: 2, name: 'Side Table', shape: 'rect' as const, x: 500, y: 300, capacity: 6, sortOrder: 1 },
  ],
  guests: [
    { id: 1, name: 'Amy Full', isChild: false, attending: true, partyId: 1, partyName: 'The Fulls', starterChoiceId: null, mainChoiceId: mainOption.id, dessertChoiceId: null, dietaryNotes: null, tableId: null, seatIndex: null },
    { id: 2, name: 'Ben Full', isChild: false, attending: true, partyId: 1, partyName: 'The Fulls', starterChoiceId: null, mainChoiceId: null, dessertChoiceId: null, dietaryNotes: null, tableId: 2, seatIndex: 1 },
    { id: 3, name: 'Uma Unseated', isChild: false, attending: true, partyId: 2, partyName: 'The Unseateds', starterChoiceId: null, mainChoiceId: null, dessertChoiceId: null, dietaryNotes: null, tableId: null, seatIndex: null },
  ],
})

const mountPage = async () => {
  registerEndpoint('/api/admin/seating', { method: 'GET', handler: () => fixture() })
  return mountSuspended(await pageModule())
}

describe('seating editor canvas', () => {
  it('renders tables with names and computed seat positions on an SVG canvas', async () => {
    const wrapper = await mountPage()
    const canvas = wrapper.find('svg[data-testid="seating-canvas"]')
    expect(canvas.exists()).toBe(true)
    expect(canvas.text()).toContain('Top Table')
    expect(canvas.text()).toContain('Side Table')
    // one seat marker per capacity across both tables
    expect(canvas.findAll('[data-seat]')).toHaveLength(8 + 6)
    const table = canvas.find('[data-table-id="1"]')
    expect(table.attributes('transform')).toContain('200')
    expect(table.attributes('transform')).toContain('150')
  })

  it('shows a seated guest on their table and dims their sidebar chip', async () => {
    const wrapper = await mountPage()
    const canvas = wrapper.find('svg[data-testid="seating-canvas"]')
    expect(canvas.text()).toContain('Ben Full')
    const chip = wrapper.find('[data-guest-chip="2"]')
    expect(chip.exists()).toBe(true)
    expect(chip.attributes('data-assigned')).toBe('true')
  })

  it('groups sidebar guests by party with meal badge and unassigned count', async () => {
    const wrapper = await mountPage()
    const sidebar = wrapper.find('[data-testid="seating-sidebar"]')
    expect(sidebar.exists()).toBe(true)
    expect(sidebar.text()).toContain('The Fulls')
    expect(sidebar.text()).toContain('The Unseateds')
    expect(sidebar.text()).toContain(mainOption.name)
    expect(wrapper.find('[data-testid="unassigned-count"]').text()).toContain('2')
  })
})

describe('seating editor state', () => {
  const editor = async () => {
    registerEndpoint('/api/admin/seating', { method: 'GET', handler: () => fixture() })
    const { useSeatingEditor } = await composable()
    const instance = useSeatingEditor()
    await instance.load()
    return instance
  }

  it('assigns a guest to an empty seat', async () => {
    const state = await editor()
    state.assignGuest(1, 1, 0)
    expect(state.guestAt(1, 0)?.id).toBe(1)
    expect(state.unassigned.value.map(guest => guest.id)).toEqual([3])
  })

  it('moving a guest frees the previous seat', async () => {
    const state = await editor()
    state.assignGuest(2, 1, 4)
    expect(state.guestAt(1, 4)?.id).toBe(2)
    expect(state.guestAt(2, 1)).toBeUndefined()
  })

  it('ignores a drop onto an occupied seat', async () => {
    const state = await editor()
    state.assignGuest(1, 2, 1)
    expect(state.guestAt(2, 1)?.id).toBe(2)
    expect(state.unassigned.value.map(guest => guest.id)).toContain(1)
  })

  it('unassigning returns the guest to the sidebar pool', async () => {
    const state = await editor()
    state.unassignGuest(2)
    expect(state.guestAt(2, 1)).toBeUndefined()
    expect(state.unassigned.value.map(guest => guest.id)).toContain(2)
  })

  it('table edits update capacity, shape, name, and position', async () => {
    const state = await editor()
    state.updateTable(1, { name: 'Head Table', shape: 'rect', capacity: 10 })
    state.moveTable(1, 333, 222)
    const table = state.tables.value.find(t => t.id === 1)!
    expect(table).toMatchObject({ name: 'Head Table', shape: 'rect', capacity: 10, x: 333, y: 222 })
  })

  it('deleting a table unseats its guests locally', async () => {
    const state = await editor()
    state.removeTable(2)
    expect(state.tables.value.some(t => t.id === 2)).toBe(false)
    expect(state.unassigned.value.map(guest => guest.id)).toContain(2)
  })
})
